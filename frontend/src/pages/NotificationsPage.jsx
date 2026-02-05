import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Loader2,
  CheckCircle2,
  Info,
  AlertTriangle,
  FolderKanban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationRead } from '../services/api';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in" data-testid="notifications-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notificações</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas as notificações lidas'}
          </p>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`transition-all ${notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
              data-testid={`notification-${notification.id}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <Badge className="bg-blue-100 text-blue-700 flex-shrink-0">Nova</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-slate-400">
                        {new Date(notification.created_at).toLocaleString('pt-BR')}
                      </span>
                      {notification.project_id && (
                        <Link 
                          to={`/projects/${notification.project_id}`}
                          className="text-xs text-teal-600 hover:underline flex items-center gap-1"
                        >
                          <FolderKanban className="w-3 h-3" />
                          Ver projeto
                        </Link>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-slate-500">
              Você será notificado sobre atualizações dos seus projetos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationsPage;
