export default function Navbar() {
  return (
    <div className="flex h-16 items-center justify-between bg-white px-4 shadow">
      <div></div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">Bienvenue, Utilisateur</span>
        <div className="h-8 w-8 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
}