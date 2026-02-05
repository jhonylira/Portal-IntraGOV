import React, { useState } from 'react';
import { Sparkles, Loader2, Brain, FileText, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { diagnoseComplexity } from '../services/api';
import { toast } from 'sonner';

const complexityColors = {
  minima: 'bg-green-100 text-green-700 border-green-300',
  media: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  alta: 'bg-red-100 text-red-700 border-red-300'
};

const complexityLabels = {
  minima: 'Mínima',
  media: 'Média',
  alta: 'Alta'
};

function AIDiagnosisPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [location, setLocation] = useState('');
  const [scope, setScope] = useState('');
  const [purpose, setPurpose] = useState('');
  const [impactScore, setImpactScore] = useState(5);
  const [urgencyScore, setUrgencyScore] = useState(5);

  const handleDiagnose = async () => {
    if (!title || !description || !projectType) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await diagnoseComplexity({
        title, description, project_type: projectType, location, scope, purpose,
        impact_score: impactScore, urgency_score: urgencyScore
      });
      setResult(response.data);
      toast.success('Diagnóstico concluído');
    } catch (error) {
      toast.error('Erro ao realizar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in" data-testid="ai-diagnosis-page">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-teal-600" />
          Diagnóstico de Complexidade com IA
        </h1>
        <p className="text-slate-500 mt-1">Use inteligência artificial para analisar a complexidade de um projeto</p>
      </div>

      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-teal-900">Como funciona</h3>
              <p className="text-sm text-teal-700 mt-1">
                Nossa IA analisa as informações do projeto e classifica sua complexidade considerando escopo, tipo, localização, impacto regional e urgência.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dados do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Projeto *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Construção de Creche Municipal" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o projeto em detalhes..." className="mt-1 min-h-[100px]" />
            </div>
            <div>
              <Label>Tipo de Projeto *</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pavimentacao">Pavimentação</SelectItem>
                  <SelectItem value="edificacao">Edificação</SelectItem>
                  <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Localização</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Bairro Centro, zona urbana" className="mt-1" />
            </div>
            <div>
              <Label>Impacto Regional: {impactScore}/10</Label>
              <Slider value={[impactScore]} onValueChange={([v]) => setImpactScore(v)} min={1} max={10} step={1} className="mt-2" />
            </div>
            <div>
              <Label>Urgência: {urgencyScore}/10</Label>
              <Slider value={[urgencyScore]} onValueChange={([v]) => setUrgencyScore(v)} min={1} max={10} step={1} className="mt-2" />
            </div>
            <Button onClick={handleDiagnose} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 mt-4">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando...</> : <><Sparkles className="w-4 h-4 mr-2" />Realizar Diagnóstico</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Resultado da Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6 slide-in">
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 mb-2">Complexidade Identificada</p>
                  <Badge className={`text-lg px-6 py-2 ${complexityColors[result.complexity] || 'bg-slate-100'}`}>
                    {complexityLabels[result.complexity] || result.complexity}
                  </Badge>
                </div>
                {result.confidence !== undefined && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500">Confiança da IA</span>
                      <span className="font-bold text-teal-600">{(result.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                {result.justification && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Justificativa</p>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4">{result.justification}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Preencha os dados e clique em "Realizar Diagnóstico"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AIDiagnosisPage;
