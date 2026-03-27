"""
Generate common abbreviations/aliases for schools missing them.
Run inside the API container or with DATABASE_URL set.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models

# Well-known abbreviations that the Scorecard API doesn't provide
MANUAL_ALIASES = {
    "Ohio State University-Main Campus": "OSU, Ohio State, tOSU, The Ohio State University",
    "Ohio State University": "OSU, Ohio State",
    "Ohio State University-Lima Campus": "OSU Lima",
    "Pennsylvania State University-Main Campus": "Penn State, PSU",
    "University of Michigan-Ann Arbor": "UMich, Michigan",
    "University of Texas at Austin": "UT Austin, UT, Texas",
    "University of Florida": "UF, Florida, Gators",
    "University of Georgia": "UGA, Georgia",
    "University of Virginia-Main Campus": "UVA, Virginia",
    "University of North Carolina at Chapel Hill": "UNC, Chapel Hill",
    "University of Wisconsin-Madison": "UW Madison, Wisconsin",
    "University of Illinois Urbana-Champaign": "UIUC, Illinois",
    "University of Minnesota-Twin Cities": "UMN, Minnesota",
    "University of Washington-Seattle Campus": "UW, Washington, UDub",
    "Georgia Institute of Technology-Main Campus": "Georgia Tech, GT",
    "Virginia Polytechnic Institute and State University": "Virginia Tech, VT",
    "University of Southern California": "USC",
    "University of Notre Dame": "Notre Dame",
    "Boston College": "BC",
    "Boston University": "BU",
    "New York University": "NYU",
    "University of Pittsburgh-Pittsburgh Campus": "Pitt, Pittsburgh",
    "University of Maryland-College Park": "UMD, Maryland",
    "Purdue University-Main Campus": "Purdue",
    "Indiana University-Bloomington": "IU, Indiana",
    "Michigan State University": "MSU, Michigan State",
    "Arizona State University-Tempe": "ASU, Arizona State",
    "Iowa State University": "ISU, Iowa State",
    "University of Iowa": "Iowa, Hawkeyes",
    "University of Arizona": "U of A, Arizona",
    "University of Oregon": "UO, Oregon, Ducks",
    "University of Colorado Boulder": "CU Boulder, Colorado",
    "University of Connecticut": "UConn",
    "University of Kentucky": "UK, Kentucky",
    "University of Tennessee-Knoxville": "UT Knoxville, Tennessee, Vols",
    "University of Alabama": "Bama, Alabama, UA",
    "Auburn University": "Auburn, AU",
    "Louisiana State University and Agricultural & Mechanical College": "LSU",
    "University of Mississippi": "Ole Miss",
    "Mississippi State University": "Miss State, Mississippi State",
    "University of South Carolina-Columbia": "USC, South Carolina, Gamecocks",
    "Clemson University": "Clemson",
    "Florida State University": "FSU, Florida State",
    "University of Miami": "Miami, The U, UM",
    "Texas A & M University-College Station": "Texas A&M, TAMU, Aggies",
    "Texas Christian University": "TCU",
    "Southern Methodist University": "SMU",
    "Baylor University": "Baylor, BU",
    "Rice University": "Rice",
    "Stanford University": "Stanford",
    "California Institute of Technology": "Caltech",
    "Carnegie Mellon University": "CMU",
    "Johns Hopkins University": "JHU, Johns Hopkins, Hopkins",
    "Northwestern University": "Northwestern, NU",
    "Vanderbilt University": "Vandy, Vanderbilt",
    "Duke University": "Duke",
    "Emory University": "Emory",
    "Georgetown University": "Georgetown",
    "Wake Forest University": "Wake Forest, WFU",
    "Tulane University of Louisiana": "Tulane",
    "University of Rochester": "U of R, Rochester",
    "Brandeis University": "Brandeis",
    "Case Western Reserve University": "Case Western, CWRU",
    "Rensselaer Polytechnic Institute": "RPI",
    "Worcester Polytechnic Institute": "WPI",
    "Stevens Institute of Technology": "Stevens",
    "Drexel University": "Drexel",
    "Villanova University": "Villanova, Nova",
    "Gonzaga University": "Gonzaga, Zags",
    "Marquette University": "Marquette",
    "Creighton University": "Creighton",
    "University of Dayton": "UD, Dayton",
    "Xavier University": "Xavier",
    "University of San Diego": "USD",
    "University of San Francisco": "USF",
    "Santa Clara University": "SCU, Santa Clara",
    "Loyola Marymount University": "LMU",
    "Pepperdine University": "Pepperdine",
    "Brigham Young University-Provo": "BYU",
    "University of Utah": "Utah, U of U",
    "Colorado State University-Fort Collins": "CSU, Colorado State",
    "University of Nebraska-Lincoln": "UNL, Nebraska, Huskers",
    "University of Kansas": "KU, Kansas, Jayhawks",
    "Kansas State University": "K-State, KSU",
    "University of Missouri-Columbia": "Mizzou, Missouri",
    "University of Oklahoma-Norman Campus": "OU, Oklahoma, Sooners",
    "Oklahoma State University-Main Campus": "Oklahoma State, OK State",
    "West Virginia University": "WVU, West Virginia",
    "University of Cincinnati-Main Campus": "UC, Cincinnati",
    "University of Louisville": "U of L, Louisville",
    "University of Memphis": "Memphis",
    "University of Central Florida": "UCF",
    "University of South Florida-Main Campus": "USF",
    "George Washington University": "GW, GWU",
    "American University": "AU, American",
    "Howard University": "Howard, HU",
    "George Mason University": "GMU, Mason",
    "College of William and Mary": "William & Mary, W&M",
    "James Madison University": "JMU",
    "Virginia Commonwealth University": "VCU",
    "North Carolina State University at Raleigh": "NC State, NCSU",
    "University of North Carolina at Charlotte": "UNC Charlotte, UNCC",
    "Rutgers University-New Brunswick": "Rutgers",
    "University of Delaware": "UD, Delaware",
    "Temple University": "Temple, TU",
    "University of Massachusetts-Amherst": "UMass, UMass Amherst",
    "University of New Hampshire-Main Campus": "UNH",
    "University of Vermont": "UVM, Vermont",
    "University of Rhode Island": "URI",
    "University of Maine": "UMaine",
    "Stony Brook University": "Stony Brook, SBU",
    "University at Buffalo": "UB, Buffalo",
    "Binghamton University": "Binghamton, Bing",
    "University at Albany": "UAlbany",
    "SUNY College of Environmental Science and Forestry": "SUNY ESF, ESF",
    "Syracuse University": "Syracuse, Cuse",
    "University of Connecticut": "UConn",
    "University of Hawaii at Manoa": "UH Manoa, Hawaii",
}


def generate_abbreviation(name: str) -> str | None:
    """Generate a common abbreviation from a school name."""
    aliases = []

    # "University of X" -> "U of X" pattern
    m = re.match(r"University of (.+?)(?:-.*)?$", name)
    if m:
        state_or_place = m.group(1).split("-")[0].strip()
        # Generate "U of X" abbreviation
        aliases.append(f"U of {state_or_place}")

    # Generate initialism from significant words
    # Strip common suffixes like "-Main Campus"
    clean = re.sub(r"-.*$", "", name).strip()
    words = clean.split()
    skip = {"of", "the", "and", "at", "in", "&", "a", "an"}
    initials = "".join(w[0] for w in words if w.lower() not in skip and w[0].isupper())
    if len(initials) >= 2 and initials != name:
        aliases.append(initials)

    return ", ".join(aliases) if aliases else None


def main():
    db = SessionLocal()
    updated = 0

    try:
        schools = db.query(models.School).all()
        for school in schools:
            new_alias = None

            # Check manual aliases first
            if school.name in MANUAL_ALIASES:
                manual = MANUAL_ALIASES[school.name]
                if school.alias:
                    # Merge: add manual aliases that aren't already present
                    existing = {a.strip().lower() for a in school.alias.split(",")}
                    new_parts = [a.strip() for a in manual.split(",")
                                 if a.strip().lower() not in existing]
                    if new_parts:
                        new_alias = school.alias + ", " + ", ".join(new_parts)
                else:
                    new_alias = manual
            elif not school.alias:
                # Auto-generate for schools with no alias at all
                new_alias = generate_abbreviation(school.name)

            if new_alias and new_alias != school.alias:
                school.alias = new_alias
                updated += 1

        db.commit()
        print(f"Updated {updated} school aliases")
    finally:
        db.close()


if __name__ == "__main__":
    main()
