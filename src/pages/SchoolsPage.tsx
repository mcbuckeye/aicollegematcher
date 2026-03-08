import { useState, useEffect } from 'react';
import { listSchools, type School } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    loadSchools();
  }, [searchQuery, stateFilter, typeFilter, regionFilter, sizeFilter, page]);

  async function loadSchools() {
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string | number> = {
        limit: pageSize,
        offset: page * pageSize,
      };
      
      if (searchQuery) params.q = searchQuery;
      if (stateFilter) params.state = stateFilter;
      if (typeFilter) params.type = typeFilter;
      if (regionFilter) params.region = regionFilter;
      if (sizeFilter) params.size = sizeFilter;
      
      const response = await listSchools(params as any);
      setSchools(response.schools);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setPage(0);
  }

  function handleFilterChange(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(0);
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Colleges</h1>
            <p className="text-gray-600">Explore {total} colleges and universities</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="xl:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Schools
                </label>
                <input
                  type="text"
                  placeholder="e.g., Harvard, MIT..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  value={regionFilter}
                  onChange={(e) => handleFilterChange(setRegionFilter, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Regions</option>
                  <option value="northeast">Northeast</option>
                  <option value="southeast">Southeast</option>
                  <option value="midwest">Midwest</option>
                  <option value="southwest">Southwest</option>
                  <option value="west">West</option>
                </select>
              </div>

              {/* Size Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <select
                  value={sizeFilter}
                  onChange={(e) => handleFilterChange(setSizeFilter, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sizes</option>
                  <option value="small">Small (&lt;5k)</option>
                  <option value="medium">Medium (5k-15k)</option>
                  <option value="large">Large (15k+)</option>
                </select>
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g., MA, CA"
                  value={stateFilter}
                  onChange={(e) => handleFilterChange(setStateFilter, e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || stateFilter || typeFilter || regionFilter || sizeFilter) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStateFilter('');
                    setTypeFilter('');
                    setRegionFilter('');
                    setSizeFilter('');
                    setPage(0);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading schools...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800">{error}</p>
              <button
                onClick={loadSchools}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : schools.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <p className="text-gray-600 text-lg">No schools found matching your criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStateFilter('');
                  setTypeFilter('');
                  setRegionFilter('');
                  setSizeFilter('');
                  setPage(0);
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Schools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {schools.map((school) => (
                  <div
                    key={school.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{school.name}</h3>
                    <p className="text-gray-600 mb-4">
                      {school.city}, {school.state}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{school.type}</span>
                      </div>
                      {school.acceptance_rate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Acceptance:</span>
                          <span className="font-medium">{school.acceptance_rate}%</span>
                        </div>
                      )}
                      {school.enrollment && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Students:</span>
                          <span className="font-medium">{school.enrollment.toLocaleString()}</span>
                        </div>
                      )}
                      {school.tuition && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tuition:</span>
                          <span className="font-medium">${(school.tuition / 1000).toFixed(0)}k</span>
                        </div>
                      )}
                    </div>

                    {school.features && school.features.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {school.features.slice(0, 3).map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="text-gray-600">
                    Page {page + 1} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
