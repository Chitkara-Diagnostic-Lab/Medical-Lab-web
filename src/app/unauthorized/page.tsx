export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-red-100 mb-4">
            <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Unauthorized</h1>
          <p className="text-gray-600 mt-2">
            You do not have permission to access this page.
          </p>
        </div>
        <div className="flex gap-4">
          <a href="/signup" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-blue-700">
            Signup
          </a>
          <a href="/signin" className="flex-1 border border-gray-300 py-2 px-4 rounded-lg text-center font-medium hover:bg-gray-50">
            Login
          </a>
        </div>
      </div>
    </div>
  )
}
