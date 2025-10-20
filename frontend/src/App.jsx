import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏨 Hotel Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Tailwind CSS v3 is working perfectly! ✨
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🔐 Authentication
              </h3>
              <p className="text-blue-700 text-sm">
                Secure login & registration
              </p>
            </div>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                🛏️ Room Management
              </h3>
              <p className="text-green-700 text-sm">
                Manage rooms & bookings
              </p>
            </div>
            
            <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                📊 Analytics
              </h3>
              <p className="text-purple-700 text-sm">
                Revenue & occupancy reports
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200">
              Get Started
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App