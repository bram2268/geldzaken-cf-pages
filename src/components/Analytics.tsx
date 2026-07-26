/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Abonnement } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, DollarSign } from 'lucide-react';

interface AnalyticsProps {
  abonnementen: Abonnement[];
  categorieen: string[];
}

const HEX_PALETTE = [
  '#3b82f6', // Blauw
  '#ef4444', // Rood
  '#eab308', // Geel
  '#a855f7', // Paars
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#ec4899', // Roze
  '#f97316', // Oranje
  '#14b8a6', // Teal
  '#6366f1', // Indigo
];

export default function Analytics({ abonnementen, categorieen }: AnalyticsProps) {
  const getCurrencySymbol = () => {
    return '€';
  };

  const activeSubs = abonnementen.filter(s => s.status === 'actief');

  const calculateMonthlySpend = (sub: Abonnement) => {
    let amt = sub.bedrag;
    if (sub.cyclus === 'jaarlijks') amt = amt / 12;
    if (sub.cyclus === 'wekelijks') amt = amt * (52 / 12);
    if (sub.cyclus === 'kwartaal') amt = amt / 3;
    return amt;
  };

  const totalMonthlySpend = activeSubs.reduce((acc, sub) => acc + calculateMonthlySpend(sub), 0);
  const totalYearlySpend = totalMonthlySpend * 12;

  // Genereer deterministische hex-kleur op basis van de naam van de categorie
  const getCategoryHexColor = (cat: string) => {
    let hash = 0;
    for (let i = 0; i < cat.length; i++) {
      hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % HEX_PALETTE.length;
    return HEX_PALETTE[index];
  };

  // Dynamische Pie-chart data
  const categoryDataMap: Record<string, number> = {};
  
  // Initialiseer bekende categorieën op 0
  categorieen.forEach(cat => {
    categoryDataMap[cat] = 0;
  });
  if (!categoryDataMap['Overig']) {
    categoryDataMap['Overig'] = 0;
  }

  activeSubs.forEach(sub => {
    const cat = sub.categorie || 'Overig';
    if (categoryDataMap[cat] === undefined) {
      categoryDataMap[cat] = 0;
    }
    categoryDataMap[cat] += calculateMonthlySpend(sub);
  });

  const categoryPieData = Object.entries(categoryDataMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .filter(item => item.value > 0);

  // Prognose komende 6 maanden
  const monthsDutch = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  const projectionData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    const monthName = monthsDutch[d.getMonth()];
    
    return {
      maand: monthName,
      'Kosten': Math.round(totalMonthlySpend)
    };
  });

  return (
    <div className="space-y-5" id="analytics-container">
      {/* KPI Overzicht met zwart-wit accenten */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-brand-dark border border-brand-border rounded-xl p-4 flex flex-col justify-between shadow-sm" id="kpi-jaar-kosten">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Kosten per jaar</span>
          <div className="text-white text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1.5">
            {getCurrencySymbol()}{totalYearlySpend.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-zinc-500 text-xs mt-1">Op basis van actieve posten</span>
        </div>

        <div className="bg-brand-dark border border-brand-border rounded-xl p-4 flex flex-col justify-between shadow-sm" id="kpi-maand-kosten">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Kosten per maand</span>
          <div className="text-white text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1.5">
            {getCurrencySymbol()}{totalMonthlySpend.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-zinc-500 text-xs mt-1">Gemiddeld per maand</span>
        </div>

        <div className="bg-brand-dark border border-brand-border rounded-xl p-4 flex flex-col justify-between shadow-sm" id="kpi-50-50-kosten">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Deel Vaste Lasten (50%)</span>
          <div className="text-white text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1.5">
            {getCurrencySymbol()}{(totalMonthlySpend / 2).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-zinc-500 text-xs mt-1">Vaste lasten per persoon per maand</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Categorie distributie */}
        <div className="bg-brand-dark border border-brand-border rounded-xl p-4 flex flex-col justify-between shadow-sm" id="categorie-chart-card">
          <div>
            <h3 className="text-white font-semibold text-xs sm:text-sm uppercase tracking-wider font-display mb-3">
              Verdeling per categorie
            </h3>
            
            {categoryPieData.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">Geen actieve posten om te tonen.</div>
            ) : (
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryHexColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#1f1f23', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(val) => [`${getCurrencySymbol()}${val}`, 'Maandlasten']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
                  <span className="text-zinc-550 text-[10px] uppercase tracking-wider">Totaal</span>
                  <span className="text-white text-base sm:text-lg font-bold font-display">
                    {getCurrencySymbol()}{Math.round(totalMonthlySpend)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 space-y-1.5 border-t border-brand-border/40 pt-3 max-h-36 overflow-y-auto">
            {categoryPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryHexColor(item.name) }}></span>
                  <span className="text-zinc-400 font-medium">{item.name}</span>
                </div>
                <span className="text-zinc-200 font-bold">
                  {getCurrencySymbol()}{item.value.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6 Maanden voorspelling */}
        <div className="bg-brand-dark border border-brand-border rounded-xl p-4 lg:col-span-2 flex flex-col justify-between shadow-sm" id="prospectief-chart-card">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-white font-semibold text-xs sm:text-sm uppercase tracking-wider font-display">
                  Voorspelling komende 6 maanden
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">Stabiel verloop op basis van uw actieve posten</p>
              </div>
              <div className="flex items-center space-x-1 text-[10px] font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Geoptimaliseerd</span>
              </div>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="maand" stroke="#3f3f46" fontSize={10} fontFamily="monospace" tickLine={false} />
                  <YAxis stroke="#3f3f46" fontSize={10} fontFamily="monospace" tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#1f1f23', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                    labelStyle={{ color: '#71717a', fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.10}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="Kosten" stroke="#ffffff" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 border-t border-brand-border/40 pt-3 flex items-center justify-between text-xs text-zinc-550">
            <span className="flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-white" />
              <span className="text-zinc-400 font-medium">Perfect overzicht van al jouw vaste lasten</span>
            </span>
            <span className="hidden sm:inline">100% veilig opgeslagen in de cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
}
