import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard' },
  { name: 'Tâches', href: '/tasks' },
  { name: 'Projets', href: '/projects' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-4">
        <h1 className="text-xl font-bold">CollabFlow V2</h1>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm font-medium ${
              pathname === item.href
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}