import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction, Category, Goal, BankrollSession, User } from '@/types';
import { formatCurrency } from '@/utils/formatters';

export interface PierreData {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  bankrollSessions: BankrollSession[];
  bankrollBalance: number;
  user: User | null;
}

export interface MonthlySummary {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  topExpenses: Array<{ category: string; amount: number }>;
  transactionCount: number;
  monthName: string;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthlySummary(data: PierreData): MonthlySummary {
  const monthKey = getCurrentMonthKey();
  const monthlyTx = data.transactions.filter(t => t.date.startsWith(monthKey));

  const income = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  const catMap = Object.fromEntries(data.categories.map(c => [c.id, c.name]));
  const expenseByCategory: Record<string, number> = {};
  monthlyTx.filter(t => t.type === 'expense').forEach(t => {
    const cat = catMap[t.categoryId] || 'Outros';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
  });

  const topExpenses = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({ category, amount }));

  return {
    income,
    expenses,
    balance,
    savingsRate,
    topExpenses,
    transactionCount: monthlyTx.length,
    monthName: format(new Date(), 'MMMM', { locale: ptBR }),
  };
}

export function getInitialMessage(userName?: string | null): string {
  const name = userName?.split(' ')[0] || 'você';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const monthName = format(new Date(), 'MMMM', { locale: ptBR });
  return `${greeting}, ${name}! 👋 Sou o **Pierre**, seu assistente financeiro pessoal.\n\nEstou aqui para te ajudar a entender suas finanças de ${monthName}. Posso analisar seus gastos, mostrar o progresso das suas metas ou simplesmente responder suas dúvidas.\n\nComo posso te ajudar hoje?`;
}

export function generateResponse(message: string, data: PierreData): string {
  const msg = message.toLowerCase().trim();
  const summary = getMonthlySummary(data);
  const { income, expenses, balance, savingsRate, topExpenses, transactionCount } = summary;
  const capitalMonth = summary.monthName.charAt(0).toUpperCase() + summary.monthName.slice(1);
  const firstName = data.user?.name?.split(' ')[0] || 'você';
  const fmt = formatCurrency;

  // Greetings
  if (/^(oi|olá|ola|hey|hello|bom dia|boa tarde|boa noite|e aí|eai|tudo bem|tudo bom)/.test(msg)) {
    const hour = new Date().getHours();
    const g = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    return `${g}, ${firstName}! 😊 Estou pronto para te ajudar.\n\nVocê pode me perguntar sobre:\n• 📊 **Resumo do mês** — visão geral das finanças\n• 💸 **Maiores gastos** — onde você mais gasta\n• 🎯 **Metas** — progresso dos objetivos\n• 💡 **Dicas** — conselhos personalizados\n• 💰 **Saldo** — quanto sobrou no mês`;
  }

  // Monthly summary
  if (/resumo|balanç|balanc|situaç|situac|como (estou|estou|tá|ta)|visão geral/.test(msg) || msg === 'resumo do mês') {
    const rateIcon = savingsRate >= 20 ? '🟢' : savingsRate >= 10 ? '🟡' : '🔴';
    const topText = topExpenses.slice(0, 3).map(({ category, amount }) => `  • ${category}: ${fmt(amount)}`).join('\n');
    const insight = savingsRate >= 20
      ? `Excelente! Você está economizando ${savingsRate.toFixed(0)}% da renda. Continue assim! 🎉`
      : savingsRate >= 0
      ? `Você está economizando ${savingsRate.toFixed(0)}%. Tente chegar a 20% para maior segurança.`
      : `⚠️ As despesas superaram as receitas em ${fmt(Math.abs(balance))}. Vamos ver onde é possível cortar.`;
    return `📊 **Resumo de ${capitalMonth}**\n\n💰 Receitas: **${fmt(income)}**\n💸 Despesas: **${fmt(expenses)}**\n${balance >= 0 ? '✅' : '⚠️'} Saldo: **${fmt(balance)}**\n${rateIcon} Taxa de poupança: **${savingsRate.toFixed(1)}%**\n📋 Transações: ${transactionCount}\n\n**Top 3 gastos:**\n${topText || '  Nenhum gasto registrado'}\n\n${insight}`;
  }

  // Goals
  if (/meta|objetivo|poupan|juntar|economizar|quanto falta/.test(msg) || msg === 'minhas metas') {
    if (data.goals.length === 0) {
      return `🎯 Você ainda não tem metas cadastradas, ${firstName}.\n\nQue tal criar uma? Comece com uma **reserva de emergência** equivalente a 3-6 meses de despesas (${fmt(expenses * 3)} a ${fmt(expenses * 6)}).`;
    }
    const goalsText = data.goals.map(g => {
      const pct = Math.min(100, Math.round(g.currentAmount / g.targetAmount * 100));
      const filled = Math.floor(pct / 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
      const remaining = g.targetAmount - g.currentAmount;
      return `**${g.title}**\n${bar} ${pct}%\n${fmt(g.currentAmount)} de ${fmt(g.targetAmount)} (faltam ${fmt(remaining)})`;
    }).join('\n\n');
    return `🎯 **Suas Metas Financeiras:**\n\n${goalsText}`;
  }

  // Biggest expenses
  if (/gasto|despesa|gastei|onde gasto|mais caro|mais cara/.test(msg) || msg === 'maiores gastos') {
    if (topExpenses.length === 0) return `Você não tem despesas registradas em ${capitalMonth} ainda!`;

    // Limites recomendados (% da renda) por categoria
    const LIMITS: Record<string, number> = {
      'moradia': 30, 'aluguel': 30, 'casa': 30, 'condomínio': 30, 'condominio': 30,
      'alimentação': 15, 'alimentacao': 15, 'supermercado': 15, 'mercado': 15,
      'restaurante': 8, 'delivery': 8, 'lanche': 8,
      'transporte': 15, 'combustível': 10, 'combustivel': 10, 'uber': 10, 'ônibus': 10, 'onibus': 10,
      'saúde': 10, 'saude': 10, 'plano': 10,
      'farmácia': 5, 'farmacia': 5, 'remédio': 5, 'remedio': 5,
      'lazer': 10, 'entretenimento': 10, 'viagem': 10,
      'vestuário': 5, 'vestuario': 5, 'roupas': 5, 'calçados': 5, 'calcados': 5,
      'educação': 10, 'educacao': 10, 'curso': 10, 'escola': 10,
      'assinaturas': 5, 'streaming': 3, 'netflix': 3, 'spotify': 3,
      'roleta': 2, 'apostas': 2, 'cassino': 2, 'jogo': 3, 'jogos': 3, 'banca': 2,
    };

    const TIPS: Record<string, string> = {
      'moradia': 'Negociação de aluguel, compartilhar espaço ou buscar bairros mais acessíveis pode libertar parte significativa da renda.',
      'aluguel': 'Tente renegociar o contrato ou avalie mudança para reduzir o comprometimento da renda.',
      'casa': 'Revise custos fixos de moradia — condomínio, IPTU e serviços podem ter opções mais baratas.',
      'alimentação': 'Planeje refeições semanais, faça lista de compras e evite desperdício — pode reduzir até 30% do gasto.',
      'alimentacao': 'Planeje refeições semanais, faça lista de compras e evite desperdício — pode reduzir até 30% do gasto.',
      'supermercado': 'Compare preços entre mercados, use apps de ofertas e evite ir com fome.',
      'mercado': 'Compare preços entre mercados, use apps de ofertas e evite ir com fome.',
      'restaurante': 'Cozinhar em casa economiza 60-70% vs restaurantes. Reserve saídas para ocasiões especiais.',
      'delivery': 'Limite pedidos de delivery a 1-2x por semana e pesquise taxas de entrega.',
      'transporte': 'Avalie transporte público, caronas ou bicicleta para trajetos rotineiros.',
      'combustível': 'Planeje rotas, evite horários de pico e mantenha o carro regulado para menos consumo.',
      'combustivel': 'Planeje rotas, evite horários de pico e mantenha o carro regulado para menos consumo.',
      'saúde': 'Compare planos de saúde e verifique se usa todos os benefícios do seu plano atual.',
      'farmácia': 'Solicite ao médico medicamentos genéricos — mesmo efeito, até 80% mais baratos.',
      'farmacia': 'Solicite ao médico medicamentos genéricos — mesmo efeito, até 80% mais baratos.',
      'lazer': 'Busque alternativas gratuitas: parques, eventos culturais, bibliotecas e esportes ao ar livre.',
      'entretenimento': 'Revise assinaturas ativas e priorize o que realmente consome.',
      'vestuário': 'Planeje compras em épocas de promoção (jan, jul) e prefira peças versáteis básicas.',
      'vestuario': 'Planeje compras em épocas de promoção (jan, jul) e prefira peças versáteis básicas.',
      'roupas': 'Invista em peças básicas de qualidade que combinam entre si, reduzindo a necessidade de novas compras.',
      'educação': 'Verifique bolsas, FIES, cursos gratuitos no SENAI, Coursera ou YouTube antes de pagar.',
      'educacao': 'Verifique bolsas, FIES, cursos gratuitos no SENAI, Coursera ou YouTube antes de pagar.',
      'assinaturas': 'Liste todas as assinaturas e cancele as que usa menos de 1x por semana.',
      'streaming': 'Mantenha apenas 1-2 plataformas de streaming e compartilhe planos familiares.',
      'roleta': 'Apostas devem ser entretenimento com orçamento fixo — nunca comprometa mais de 2% da renda.',
      'apostas': 'Defina um limite fixo mensal para apostas e respeite-o rigorosamente.',
      'cassino': 'Estabeleça um valor máximo mensal para jogos e trate como lazer, não como investimento.',
      'jogos': 'Defina um orçamento mensal para jogos e aguarde promoções para novas compras.',
    };

    const getLimit = (cat: string): number | null => {
      const lower = cat.toLowerCase();
      for (const [key, limit] of Object.entries(LIMITS)) {
        if (lower.includes(key)) return limit;
      }
      return null;
    };

    const getTip = (cat: string): string | null => {
      const lower = cat.toLowerCase();
      for (const [key, tip] of Object.entries(TIPS)) {
        if (lower.includes(key)) return tip;
      }
      return null;
    };

    const expenseRate = income > 0 ? (expenses / income * 100) : 0;
    const warnings: Array<{ category: string; pct: number; limit: number; tip: string }> = [];

    const topText = topExpenses.slice(0, 5).map(({ category, amount }, i) => {
      const pct = income > 0 ? (amount / income * 100) : 0;
      const limit = getLimit(category);
      const tip = getTip(category);
      let icon = '🟢';
      if (limit !== null && pct > limit) {
        icon = '🔴';
        if (tip && warnings.length < 3) warnings.push({ category, pct, limit, tip });
      } else if (limit !== null && pct > limit * 0.8) {
        icon = '🟡';
      }
      const pctStr = income > 0 ? ` (${pct.toFixed(0)}% da renda)` : '';
      return `${i + 1}. ${icon} **${category}**: ${fmt(amount)}${pctStr}`;
    }).join('\n');

    let overall = '';
    if (income === 0) {
      overall = `ℹ️ Registre suas receitas para ver a análise percentual completa.`;
    } else if (expenseRate > 90) {
      overall = `🔴 **Situação crítica:** ${expenseRate.toFixed(0)}% da renda comprometida. Revisar gastos é urgente!`;
    } else if (expenseRate > 75) {
      overall = `🟡 **Atenção:** ${expenseRate.toFixed(0)}% da renda em despesas. Procure reduzir para guardar mais.`;
    } else {
      overall = `🟢 **Boa distribuição:** ${expenseRate.toFixed(0)}% da renda em despesas. Continue mantendo o controle!`;
    }

    let result = `💸 **Maiores gastos de ${capitalMonth}:**\n\n${topText}\n\n**Total:** ${fmt(expenses)}\n\n${overall}`;

    if (warnings.length > 0) {
      const warningText = warnings.map(w =>
        `• **${w.category}** — ${w.pct.toFixed(0)}% da renda (recomendado: até ${w.limit}%)\n  💡 ${w.tip}`
      ).join('\n\n');
      result += `\n\n📌 **Como melhorar:**\n\n${warningText}`;
    }

    return result;
  }

  // Income
  if (/receita|salário|salario|renda|ganho|ganhei|receb|minhas receitas/.test(msg)) {
    const monthKey = getCurrentMonthKey();
    const incomeByCategory: Record<string, number> = {};
    data.transactions.filter(t => t.type === 'income' && t.date.startsWith(monthKey)).forEach(t => {
      const cat = data.categories.find(c => c.id === t.categoryId)?.name || 'Outros';
      incomeByCategory[cat] = (incomeByCategory[cat] || 0) + t.amount;
    });
    const incomeText = Object.entries(incomeByCategory).map(([cat, val]) => `  • ${cat}: ${fmt(val)}`).join('\n');
    return `💰 **Receitas de ${capitalMonth}:**\n\n${incomeText || '  Nenhuma receita registrada'}\n\n**Total: ${fmt(income)}**`;
  }

  // Balance
  if (/saldo|quanto tenho|quanto sobrou|quanto sobra/.test(msg)) {
    return `💰 Seu saldo de ${capitalMonth} é **${fmt(balance)}**.\n\nReceitas: ${fmt(income)}\nDespesas: ${fmt(expenses)}\n\n${balance >= 0 ? 'Você está no positivo! Continue assim.' : `As despesas superaram as receitas em ${fmt(Math.abs(balance))}.`}`;
  }

  // Financial tips
  if (/dica|conselho|como posso melhora|como economi|o que (devo|posso) fazer|dicas financeiras/.test(msg)) {
    const tips: string[] = [];
    if (savingsRate < 20) tips.push(`💡 Você está economizando ${savingsRate.toFixed(0)}% da renda. O ideal é atingir **20%** — isso garante segurança e investimentos futuros.`);
    if (topExpenses[0] && income > 0 && topExpenses[0].amount > income * 0.35) {
      tips.push(`⚠️ **${topExpenses[0].category}** consome ${(topExpenses[0].amount / income * 100).toFixed(0)}% da renda. Analise se há margem para reduzir.`);
    }
    tips.push('📈 Mantenha uma **reserva de emergência** com 3-6 meses de despesas para imprevistos.');
    tips.push('🎯 Acompanhe suas metas regularmente — visualizar o progresso aumenta a motivação.');
    tips.push('💳 Sempre que possível, pague à vista para evitar juros e parcelamentos.');
    return `📚 **Dicas Personalizadas para ${firstName}:**\n\n${tips.join('\n\n')}`;
  }

  // Bankroll
  if (/banca|cassino|roleta|jogo|apostas|sessão/.test(msg)) {
    const sessions = data.bankrollSessions;
    const totalProfit = sessions.reduce((s, x) => s + x.profit, 0);
    const winSessions = sessions.filter(s => s.profit > 0).length;
    return `🎲 **Sua Banca:**\n\nSaldo atual: **${fmt(data.bankrollBalance)}**\nTotal de sessões: ${sessions.length}\nSessões positivas: ${winSessions}/${sessions.length}\nResultado total: ${totalProfit >= 0 ? '✅' : '⚠️'} **${fmt(totalProfit)}**\n\n${totalProfit < 0 ? '⚠️ Lembre-se sempre de jogar com responsabilidade e dentro dos seus limites.' : '✅ Bom gerenciamento de banca!'}`;
  }

  // Thanks
  if (/obrigad|valeu|vlw|thanks|ótimo|otimo|perfeito|show/.test(msg)) {
    return `Por nada, ${firstName}! 😊 Estou sempre aqui se precisar de ajuda com suas finanças. É só perguntar!`;
  }

  // Help
  if (/o que (você|vc) (pode|faz|sabe)|ajuda|help|como usar/.test(msg)) {
    return `Posso te ajudar com:\n\n📊 **"Resumo do mês"** — balanço geral de receitas e despesas\n💸 **"Maiores gastos"** — onde você mais gasta\n💰 **"Minhas receitas"** — de onde vem seu dinheiro\n🎯 **"Minhas metas"** — progresso dos objetivos\n💡 **"Dicas financeiras"** — conselhos personalizados\n💰 **"Saldo"** — quanto sobrou no mês\n\nFique à vontade para perguntar em linguagem natural! 😊`;
  }

  // Default
  return `Entendi! Para te ajudar melhor, experimente perguntar:\n\n• "Resumo do mês"\n• "Onde estou gastando mais?"\n• "Como estão minhas metas?"\n• "Me dá dicas financeiras"`;
}
