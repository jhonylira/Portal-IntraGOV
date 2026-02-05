# Portal IntraAMVALI - PRD (Product Requirements Document)

## Original Problem Statement
Plataforma web institucional inteligente para gestão de demandas técnicas dos municípios associados à AMVALI (Associação dos Municípios do Vale do Itapocu). Sistema completo para organizar, priorizar, acompanhar e automatizar fluxos de trabalho de projetos técnicos (Pavimentação, Edificação, Infraestrutura).

## User Personas
1. **Gestor AMVALI** - Administrador com acesso total ao sistema
2. **Técnico AMVALI** - Arquitetos, engenheiros e projetistas
3. **Municipal** - Representantes dos municípios (prefeitos, secretários)

## Core Requirements
- Autenticação JWT com 3 perfis de acesso
- Dashboard com métricas e indicadores
- Sistema de priorização por estrelas (1-5)
- Fila técnica inteligente com IPR Score
- Roadmap interativo de projetos
- Gestão de capacidade da equipe
- Diagnóstico de complexidade com IA Claude

## What's Been Implemented (Jan 2026)

### Backend (FastAPI + MongoDB)
- ✅ Autenticação JWT completa
- ✅ CRUD de projetos com etapas/stages
- ✅ Sistema de municípios com engajamento
- ✅ Gestão de equipe técnica
- ✅ Fila técnica com ordenação IPR
- ✅ Cálculo automático de IPR Score
- ✅ Integração Claude para diagnóstico IA
- ✅ Sistema de notificações
- ✅ Seed data para demonstração

### Frontend (React + Shadcn UI)
- ✅ Login page com hero section
- ✅ Dashboard com gráficos (Recharts)
- ✅ Lista de projetos com filtros
- ✅ Wizard de criação multi-etapas
- ✅ Detalhe do projeto com Roadmap
- ✅ Componente StarRating
- ✅ Componente RoadmapTimeline
- ✅ Página de fila técnica
- ✅ Página de equipe técnica
- ✅ Página de municípios
- ✅ Página de diagnóstico IA
- ✅ Sidebar responsiva por perfil
- ✅ Design GovTech (Teal + Slate + Amber)

## Prioritized Backlog

### P0 (Crítico) - DONE
- [x] Autenticação e autorização
- [x] CRUD de projetos
- [x] Sistema de priorização
- [x] Dashboard básico

### P1 (Alto) - DONE
- [x] Roadmap interativo
- [x] Fila técnica IPR
- [x] Diagnóstico IA
- [x] Gestão de equipe

### P2 (Médio) - Pendente
- [ ] Upload de documentos
- [ ] Gráfico Gantt completo
- [ ] Histórico de alterações
- [ ] Relatórios exportáveis (PDF)

### P3 (Baixo) - Futuro
- [ ] Integração SINAPI/Custos
- [ ] App mobile
- [ ] BI/Analytics avançado
- [ ] Notificações WhatsApp/Email

## Next Tasks
1. Implementar upload de documentos/anexos
2. Adicionar histórico de alterações nos projetos
3. Criar relatórios PDF exportáveis
4. Implementar paginação nas listas
5. Adicionar filtros avançados na fila técnica
