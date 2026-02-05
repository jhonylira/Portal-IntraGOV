import React from 'react';
import { 
  Settings, 
  User,
  Bell,
  Shield,
  Palette
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1">
          Gerencie suas preferências e informações da conta
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Perfil
          </CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-teal-700">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{user?.name}</h3>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                {user?.role === 'gestor_amvali' && 'Gestor AMVALI'}
                {user?.role === 'tecnico_amvali' && 'Técnico AMVALI'}
                {user?.role === 'municipal' && 'Usuário Municipal'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
          <CardDescription>Configure como deseja ser notificado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-updates">Atualizações de projeto</Label>
              <p className="text-sm text-slate-500">Receba notificações quando seus projetos forem atualizados</p>
            </div>
            <Switch id="notify-updates" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-deadlines">Alertas de prazo</Label>
              <p className="text-sm text-slate-500">Seja avisado sobre prazos próximos</p>
            </div>
            <Switch id="notify-deadlines" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-queue">Atualizações da fila</Label>
              <p className="text-sm text-slate-500">Notificações sobre mudanças na posição da fila</p>
            </div>
            <Switch id="notify-queue" />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Aparência
          </CardTitle>
          <CardDescription>Personalize a interface</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Tema</Label>
              <p className="text-sm text-slate-500">Escolha entre tema claro ou escuro</p>
            </div>
            <Button variant="outline" disabled>
              Tema Claro (Padrão)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Segurança
          </CardTitle>
          <CardDescription>Gerencie sua segurança</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Alterar senha</Label>
              <p className="text-sm text-slate-500">Atualize sua senha de acesso</p>
            </div>
            <Button variant="outline" disabled>
              Alterar
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Sessões ativas</Label>
              <p className="text-sm text-slate-500">Gerencie seus dispositivos conectados</p>
            </div>
            <Button variant="outline" disabled>
              Ver sessões
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
