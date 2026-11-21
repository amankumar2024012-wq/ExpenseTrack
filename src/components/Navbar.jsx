function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="text-xl font-semibold">
          Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
          A
        </div>

        <div>
          <p className="text-sm font-medium">Aman</p>
          <p className="text-xs text-gray-500">
            Personal Account
          </p>
        </div>
      </div>
    </header>
  );
}

export default Navbar;