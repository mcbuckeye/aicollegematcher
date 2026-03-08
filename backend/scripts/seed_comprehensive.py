#!/usr/bin/env python3
"""
Seed database from the curated schools dataset (154 schools).
Uses the TypeScript data file we already generated.
Run this when the College Scorecard API is rate-limited.
"""
import sys, os, re, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal, engine
from app.models import Base, School

# Parse the TypeScript schools file
TS_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'schools.ts')

def parse_ts_schools(path):
    """Parse the TypeScript SCHOOLS array into Python dicts"""
    with open(path, 'r') as f:
        content = f.read()
    
    # Extract the array content between SCHOOLS: School[] = [ ... ]
    match = re.search(r'export const SCHOOLS: School\[\] = \[(.*)\]', content, re.DOTALL)
    if not match:
        print("Could not find SCHOOLS array in TypeScript file")
        return []
    
    array_content = match.group(1)
    
    # Parse each object block
    schools = []
    # Split by '},\n  {' pattern
    blocks = re.split(r'\},\s*\{', array_content)
    
    for block in blocks:
        block = block.strip().strip('{').strip('}').strip(',')
        if not block:
            continue
        
        school = {}
        # Extract key-value pairs
        for line in block.split('\n'):
            line = line.strip().rstrip(',')
            if ':' not in line:
                continue
            key_match = re.match(r'(\w+):\s*(.+)', line)
            if not key_match:
                continue
            key = key_match.group(1)
            val = key_match.group(2).strip().rstrip(',')
            
            # Parse value
            if val.startswith('"') or val.startswith("'"):
                school[key] = val.strip('"').strip("'")
            elif val.startswith('['):
                # Array - try to parse
                try:
                    school[key] = json.loads(val.rstrip(','))
                except:
                    # Handle string arrays with single quotes
                    items = re.findall(r'"([^"]*)"', val)
                    if items:
                        school[key] = items
                    else:
                        try:
                            nums = re.findall(r'[\d.]+', val)
                            school[key] = [int(n) if '.' not in n else float(n) for n in nums]
                        except:
                            school[key] = []
            elif val == 'true':
                school[key] = True
            elif val == 'false':
                school[key] = False
            else:
                try:
                    school[key] = float(val) if '.' in val else int(val)
                except:
                    school[key] = val
        
        if 'name' in school:
            schools.append(school)
    
    return schools

def main():
    print("Parsing TypeScript schools file...")
    schools_data = parse_ts_schools(TS_FILE)
    print(f"Found {len(schools_data)} schools in TS file")
    
    if not schools_data:
        print("No schools found. Exiting.")
        return
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    added = 0
    updated = 0
    
    for s in schools_data:
        name = s.get('name', '')
        if not name:
            continue
        
        # Check if school already exists
        existing = db.query(School).filter(School.name == name).first()
        
        location = s.get('location', '')
        city = location.split(',')[0].strip() if ',' in location else location
        state_raw = s.get('state', location.split(',')[-1].strip() if ',' in location else '')
        
        # Convert full state name to 2-letter abbreviation
        STATE_MAP = {
            'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
            'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
            'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
            'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA',
            'Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT',
            'Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM',
            'New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK',
            'Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
            'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
            'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
            'District of Columbia':'DC','D.C.':'DC',
        }
        state = STATE_MAP.get(state_raw.strip(), state_raw.strip()[:2].upper())
        
        sat_range = s.get('satRange', [1000, 1200])
        act_range = s.get('actRange', [22, 28])
        
        school_data = {
            'name': name,
            'city': city,
            'state': state,
            'type': s.get('type', 'private'),
            'setting': s.get('setting', 'suburban'),
            'size': s.get('size', 'medium'),
            'enrollment': s.get('enrollment', 5000),
            'acceptance_rate': s.get('acceptanceRate', 50.0),
            'sat_range_low': sat_range[0] if isinstance(sat_range, list) and len(sat_range) >= 2 else 1000,
            'sat_range_high': sat_range[1] if isinstance(sat_range, list) and len(sat_range) >= 2 else 1200,
            'act_range_low': act_range[0] if isinstance(act_range, list) and len(act_range) >= 2 else 22,
            'act_range_high': act_range[1] if isinstance(act_range, list) and len(act_range) >= 2 else 28,
            'avg_gpa': s.get('avgGPA', 3.5),
            'tuition': s.get('tuition', 30000),
            'room_and_board': s.get('roomAndBoard', 13000),
            'avg_financial_aid': s.get('avgFinancialAid', 15000),
            'graduation_rate': s.get('graduationRate', 70),
            'retention_rate': s.get('retentionRate', 80),
            'median_earnings_10yr': s.get('medianEarnings10yr', 55000),
            'student_faculty_ratio': s.get('studentFacultyRatio', 15),
            'region': s.get('region', 'northeast'),
            'hbcu': s.get('hbcu', False),
            'religious_affiliation': 'religious' in s.get('features', []),
            'features': s.get('features', []),
            'majors_strength': s.get('majorsStrength', []),
            'description': s.get('description', f'{name} is a university.'),
        }
        
        if existing:
            for k, v in school_data.items():
                setattr(existing, k, v)
            updated += 1
        else:
            db.add(School(**school_data))
            added += 1
    
    db.commit()
    
    total = db.query(School).count()
    print(f"\nDone! Added {added}, updated {updated}. Total in DB: {total}")
    db.close()

if __name__ == '__main__':
    main()
