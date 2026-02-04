import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  ListOrdered, 
  Users, 
  Building2, 
  Settings,
  Bell,
  LogOut,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const Sidebar = () => {
  const { user, logout, isGestor, isTecnico } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard',
      roles: ['gestor_amvali', 'tecnico_amvali', 'municipal']
    },
    { 
      icon: FolderKanban, 
      label: 'Projetos', 
      path: '/projects',
      roles: ['gestor_amvali', 'tecnico_amvali', 'municipal']
    },
    { 
      icon: ListOrdered, 
      label: 'Fila Técnica', 
      path: '/queue',
      roles: ['gestor_amvali', 'tecnico_amvali']
    },
    { 
      icon: Users, 
      label: 'Equipe', 
      path: '/team',
      roles: ['gestor_amvali']
    },
    { 
      icon: Building2, 
      label: 'Municípios', 
      path: '/municipalities',
      roles: ['gestor_amvali']
    },
    { 
      icon: Sparkles, 
      label: 'IA Diagnóstico', 
      path: '/ai-diagnosis',
      roles: ['gestor_amvali', 'tecnico_amvali']
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-900">IntraAMVALI</h1>
            <p className="text-xs text-slate-500">Portal de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "sidebar-item",
              isActive && "active"
            )}
            data-testid={`nav-${item.path.slice(1)}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* New Project Button */}
        <NavLink
          to="/projects/new"
          className="sidebar-item mt-4 bg-teal-50 text-teal-700 hover:bg-teal-100"
          data-testid="nav-new-project"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Nova Solicitação</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <NavLink
          to="/notifications"
          className={({ isActive }) => cn(
            "sidebar-item",
            isActive && "active"
          )}
          data-testid="nav-notifications"
        >
          <Bell className="w-5 h-5" />
          <span>Notificações</span>
        </NavLink>
        
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "sidebar-item",
            isActive && "active"
          )}
          data-testid="nav-settings"
        >
          <Settings className="w-5 h-5" />
          <span>Configurações</span>
        </NavLink>

        {/* User Info */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-sm font-medium text-slate-600">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.role === 'gestor_amvali' && 'Gestor AMVALI'}
                {user?.role === 'tecnico_amvali' && 'Técnico AMVALI'}
                {user?.role === 'municipal' && 'Municipal'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-red-600 hover:bg-red-50 hover:text-red-700"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
