import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Building2 } from 'lucide-react';
import { seedData } from '../../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedData();
      setError('');
      alert('Dados de exemplo criados com sucesso! Use admin@amvali.org.br / admin123 para entrar.');
    } catch (err) {
      setError('Erro ao criar dados de exemplo');
    }
    setSeeding(false);
  };

  const quickLogins = [
    { email: 'admin@amvali.org.br', password: 'admin123', label: 'Gestor AMVALI' },
    { email: 'tecnico1@amvali.org.br', password: 'tecnico123', label: 'Técnico' },
    { email: 'municipal@jaragua.sc.gov.br', password: 'municipal123', label: 'Municipal' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Hero */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1590467510035-8e4c831b1243?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjaXR5JTIwYXJjaGl0ZWN0dXJlJTIwYWVyaWFsfGVufDB8fHx8MTc3MDIzNTA1NHww&ixlib=rb-4.1.0&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-teal-900/80" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">IntraAMVALI</h1>
              <p className="text-teal-200 text-sm">Portal de Gestão de Projetos</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Gestão Inteligente de<br />
            Demandas Técnicas
          </h2>
          <p className="text-lg text-slate-300 max-w-md">
            Plataforma institucional para organizar, priorizar e acompanhar 
            projetos técnicos dos municípios do Vale do Itapocu.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-3xl font-bold text-teal-400">+50</p>
              <p className="text-sm text-slate-300">Projetos Gerenciados</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-3xl font-bold text-teal-400">5</p>
              <p className="text-sm text-slate-300">Municípios Atendidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900">IntraAMVALI</h1>
              <p className="text-xs text-slate-500">Portal de Gestão</p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
              <CardDescription>
                Acesse sua conta para gerenciar projetos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="login-email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="login-password"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={loading}
                  data-testid="login-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>

              {/* Quick logins for demo */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-3">Acesso rápido (demo):</p>
                <div className="space-y-2">
                  {quickLogins.map((cred, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setEmail(cred.email);
                        setPassword(cred.password);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm transition-colors"
                      data-testid={`quick-login-${index}`}
                    >
                      <span className="font-medium text-slate-700">{cred.label}</span>
                      <span className="text-slate-400 ml-2">{cred.email}</span>
                    </button>
                  ))}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleSeed}
                  disabled={seeding}
                  data-testid="seed-button"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando dados...
                    </>
                  ) : (
                    'Criar dados de exemplo'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
