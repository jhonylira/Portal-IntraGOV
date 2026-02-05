import React, { useState } from 'react';
import { 
  Sparkles, 
  Loader2,
  Brain,
  FileText,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { diagnoseComplexity } from '../services/api';
import { toast } from 'sonner';

const AIDiagnosisPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: '',
    location: '',
    scope: '',
    purpose: '',
    impact_score: 5,
    urgency_score: 5
  });

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDiagnose = async () => {
    if (!formData.title || !formData.description || !formData.project_type) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await diagnoseComplexity(formData);
      setResult(response.data);
      toast.success('Diagnóstico concluído');
    } catch (error) {
      console.error('Diagnosis failed:', error);
      toast.error('Erro ao realizar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in" data-testid="ai-diagnosis-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-teal-600" />
          Diagnóstico de Complexidade com IA
        </h1>
        <p className="text-slate-500 mt-1">
          Use inteligência artificial para analisar a complexidade de um projeto
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-teal-900">Como funciona</h3>
              <p className="text-sm text-teal-700 mt-1">
                Nossa IA analisa as informações do projeto e classifica sua complexidade 
                considerando escopo, tipo, localização, impacto regional e urgência. 
                O resultado ajuda a calcular o <strong>IPR (Índice de Prioridade Regional)</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dados do Projeto
            </CardTitle>
            <CardDescription>
              Preencha as informações para análise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Projeto *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="Ex: Construção de Creche Municipal"
                className="mt-1"
                data-testid="input-title"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Descreva o projeto em detalhes..."
                className="mt-1 min-h-[100px]"
                data-testid="input-description"
              />
            </div>

            <div>
              <Label>Tipo de Projeto *</Label>
              <Select 
                value={formData.project_type} 
                onValueChange={(value) => updateForm('project_type', value)}
              >
                <SelectTrigger className="mt-1" data-testid="select-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pavimentacao">Pavimentação</SelectItem>
                  <SelectItem value="edificacao">Edificação</SelectItem>
                  <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateForm('location', e.target.value)}
                placeholder="Ex: Bairro Centro, zona urbana"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="scope">Escopo</Label>
              <Textarea
                id="scope"
                value={formData.scope}
                onChange={(e) => updateForm('scope', e.target.value)}
                placeholder="Detalhe o escopo técnico..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="purpose">Finalidade</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => updateForm('purpose', e.target.value)}
                placeholder="Qual a finalidade do projeto?"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Impacto Regional: {formData.impact_score}/10</Label>
              <Slider
                value={[formData.impact_score]}
                onValueChange={([value]) => updateForm('impact_score', value)}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Urgência: {formData.urgency_score}/10</Label>
              <Slider
                value={[formData.urgency_score]}
                onValueChange={([value]) => updateForm('urgency_score', value)}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
            </div>

            <Button 
              onClick={handleDiagnose}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
              data-testid="btn-diagnose"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Realizar Diagnóstico
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
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
                {/* Complexity Badge */}
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 mb-2">Complexidade Identificada</p>
                  <Badge 
                    className={`text-lg px-6 py-2 ${complexityColors[result.complexity] || 'bg-slate-100'}`}
                  >
                    {complexityLabels[result.complexity] || result.complexity}
                  </Badge>
                </div>

                {/* Confidence */}
                {result.confidence !== undefined && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500">Confiança da IA</span>
                      <span className="font-bold text-teal-600">
                        {(result.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Justification */}
                {result.justification && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Justificativa</p>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4">
                      {result.justification}
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Recomendações</p>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li 
                          key={index}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 text-xs">
                            {index + 1}
                          </span>
                          {rec}
                        </li>
                      ))}
                    </ul>
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
};

export default AIDiagnosisPage;
