'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TradesTable({ trades, title, icon }) {
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());

  const formatValue = (value) => {
    if (!value) return '-';
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (num) => {
    if (!num) return '-';
    return num.toLocaleString();
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercent = (value) => {
    if (!value) return '-';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(0)}%`;
  };

  // Group trades by company for cluster buys
  const groupedTrades = title === "Cluster Buys" ? groupTradesByCompany(trades) : null;

  function groupTradesByCompany(trades) {
    const groups = {};
    
    trades.forEach(trade => {
      const key = `${trade.ticker}-${trade.company_name}`;
      if (!groups[key]) {
        groups[key] = {
          ticker: trade.ticker,
          company_name: trade.company_name,
          filing_date: trade.filing_date,
          trade_date: trade.trade_date,
          trades: [],
          total_value: 0,
          total_quantity: 0,
          avg_price: 0,
          insider_count: 0
        };
      }
      
      groups[key].trades.push(trade);
      groups[key].total_value += trade.transaction_value || 0;
      groups[key].total_quantity += trade.quantity || 0;
      
      // Get the most recent dates
      if (!groups[key].filing_date || new Date(trade.filing_date) > new Date(groups[key].filing_date)) {
        groups[key].filing_date = trade.filing_date;
      }
      if (!groups[key].trade_date || new Date(trade.trade_date) > new Date(groups[key].trade_date)) {
        groups[key].trade_date = trade.trade_date;
      }
    });

    // Calculate averages and counts
    Object.values(groups).forEach(group => {
      group.insider_count = group.trades.length;
      group.avg_price = group.total_value / group.total_quantity;
    });

    return Object.values(groups);
  }

  const toggleCompany = (key) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCompanies(newExpanded);
  };

  const isClusterTable = title === "Cluster Buys";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-900 uppercase dark:text-white flex items-center gap-2">
          <span>{title}</span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900">
              {isClusterTable && <TableHead className="w-8 min-w-8"></TableHead>}
              <TableHead className="text-left text-xs font-medium w-32 min-w-32">Filing Date</TableHead>
              <TableHead className="text-left text-xs font-medium w-24 min-w-24">Trade Date</TableHead>
              <TableHead className="text-left text-xs font-medium w-20 min-w-20">Ticker</TableHead>
              <TableHead className="text-left text-xs font-medium min-w-48">Company Name</TableHead>
              <TableHead className="text-left text-xs font-medium w-24 min-w-24">Industry</TableHead>
              {isClusterTable && <TableHead className="text-center text-xs font-medium w-12 min-w-12">Ins</TableHead>}
              {!isClusterTable && <TableHead className="text-left text-xs font-medium min-w-48">Insider</TableHead>}
              <TableHead className="text-center text-xs font-medium w-32 min-w-32">Trade Type</TableHead>
              <TableHead className="text-right text-xs font-medium w-20 min-w-20">Price</TableHead>
              <TableHead className="text-right text-xs font-medium w-24 min-w-24">Qty</TableHead>
              <TableHead className="text-right text-xs font-medium w-24 min-w-24">Owned</TableHead>
              <TableHead className="text-right text-xs font-medium w-20 min-w-20">ΔOwn</TableHead>
              <TableHead className="text-right text-xs font-medium w-24 min-w-24">Value</TableHead>
              <TableHead className="text-right text-xs font-medium w-12 min-w-12">1d</TableHead>
              <TableHead className="text-right text-xs font-medium w-12 min-w-12">1w</TableHead>
              <TableHead className="text-right text-xs font-medium w-12 min-w-12">1m</TableHead>
              <TableHead className="text-right text-xs font-medium w-12 min-w-12">6m</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isClusterTable ? 17 : 16} className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No trades found
                </TableCell>
              </TableRow>
            ) : isClusterTable && groupedTrades ? (
              // Cluster table with expandable rows
              <>
                {groupedTrades.map((group, idx) => {
                  const companyKey = `${group.ticker}-${group.company_name}`;
                  const isExpanded = expandedCompanies.has(companyKey);
                  
                  return (
                    <React.Fragment key={companyKey}>
                      {/* Parent row - aggregated company data */}
                      <TableRow
                        onClick={() => toggleCompany(companyKey)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <TableCell className="w-8 min-w-8">
                          <ChevronDown
                            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 w-32 min-w-32">
                          {formatDateTime(group.filing_date)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 w-24 min-w-24">
                          {formatDate(group.trade_date)}
                        </TableCell>
                        <TableCell className="w-20 min-w-20">
                          <span className="text-sm font-medium text-gray-900">
                            {group.ticker}
                          </span>
                        </TableCell>
                        <TableCell className="min-w-48">
                          <span className="text-sm font-medium text-gray-900">
                            {group.company_name}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 w-24 min-w-24">
                          {/* Industry field - not in current schema */}
                          -
                        </TableCell>
                        <TableCell className="text-center w-12 min-w-12">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-gray-900 rounded-full">
                            {group.insider_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-center w-32 min-w-32">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 whitespace-nowrap">
                            P - Purchase
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-right text-gray-900 dark:text-white w-20 min-w-20">
                          ${group.avg_price?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-right text-gray-600 dark:text-gray-400 w-24 min-w-24">
                          +{formatNumber(group.total_quantity)}
                        </TableCell>
                        <TableCell className="text-sm text-right text-gray-600 dark:text-gray-400 w-24 min-w-24">
                          {formatNumber(group.trades[0]?.shares_owned_after)}
                        </TableCell>
                        <TableCell className="text-sm text-right text-gray-600 dark:text-gray-400 w-20 min-w-20">
                          {formatPercent(group.trades[0]?.delta_ownership)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-semibold text-gray-900 dark:text-white w-24 min-w-24">
                          {formatValue(group.total_value)}
                        </TableCell>
                        <TableCell className="text-sm text-right text-gray-700 w-12 min-w-12">
                          {/* Price change fields - not in current schema */}
                          -
                        </TableCell>
                        <TableCell className="text-sm text-right text-gray-700 w-12 min-w-12">
                          -
                        </TableCell>
                        <TableCell className="text-sm text-right text-gray-700 w-12 min-w-12">
                          -
                        </TableCell>
                        <TableCell className="text-sm text-right text-gray-700 w-12 min-w-12">
                          -
                        </TableCell>
                      </TableRow>

                      {/* Expanded child rows - individual insider trades */}
                      {isExpanded && group.trades.map((trade, tradeIdx) => (
                        <TableRow
                          key={`${companyKey}-${tradeIdx}`}
                          className="bg-white dark:bg-gray-800"
                        >
                          <TableCell className="w-8 min-w-8"></TableCell>
                          <TableCell className="text-xs text-gray-500 dark:text-gray-500 w-32 min-w-32">
                            {formatDateTime(trade.filing_date)}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 dark:text-gray-500 w-24 min-w-24">
                            {formatDate(trade.trade_date)}
                          </TableCell>
                          <TableCell className="text-xs text-gray-700 dark:text-gray-300 w-20 min-w-20">
                            {trade.ticker}
                          </TableCell>
                          <TableCell className="text-xs text-gray-700 dark:text-gray-300 min-w-48">
                            {trade.insider_name}
                            {trade.insider_title && (
                              <span className="text-gray-500 dark:text-gray-500 ml-1">
                                ({trade.insider_title})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 dark:text-gray-500 w-24 min-w-24">
                            -
                          </TableCell>
                          <TableCell className="text-center text-xs text-gray-500 dark:text-gray-500 w-12 min-w-12">
                            1
                          </TableCell>
                          <TableCell className="text-center w-32 min-w-32">
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 whitespace-nowrap">
                              {trade.transaction_type}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-right text-gray-700 dark:text-gray-300 w-20 min-w-20">
                            ${trade.price?.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-right text-gray-600 dark:text-gray-400 w-24 min-w-24">
                            +{formatNumber(trade.quantity)}
                          </TableCell>
                          <TableCell className="text-xs text-right text-gray-600 dark:text-gray-400 w-24 min-w-24">
                            {formatNumber(trade.shares_owned_after)}
                          </TableCell>
                          <TableCell className="text-xs text-right text-gray-600 dark:text-gray-400 w-20 min-w-20">
                            {formatPercent(trade.delta_ownership)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium text-gray-700 dark:text-gray-300 w-24 min-w-24">
                            {formatValue(trade.transaction_value)}
                          </TableCell>
                          <TableCell className="text-xs text-right text-gray-500 dark:text-gray-500 w-12 min-w-12">
                            -
                          </TableCell>
                          <TableCell className="text-xs text-right text-gray-500 dark:text-gray-500 w-12 min-w-12">
                            -
                          </TableCell>
                          <TableCell className="text-xs text-right text-gray-500 dark:text-gray-500 w-12 min-w-12">
                            -
                          </TableCell>
                          <TableCell className="text-xs text-right text-gray-500 dark:text-gray-500 w-12 min-w-12">
                            -
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })}
              </>
            ) : (
              // Regular table for non-cluster trades
              trades.map((trade, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400 w-32 min-w-32">
                    {formatDateTime(trade.filing_date)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400 w-24 min-w-24">
                    {formatDate(trade.trade_date)}
                  </TableCell>
                  <TableCell className="w-20 min-w-20">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {trade.ticker}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-900 dark:text-white min-w-48">
                    {trade.company_name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400 w-24 min-w-24">
                    -
                  </TableCell>
                  <TableCell className="text-sm text-gray-900 dark:text-white min-w-48">
                    {trade.insider_name}
                    {trade.insider_title && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {trade.insider_title}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center w-32 min-w-32">
                    <span className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                      trade.transaction_type === 'P'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {trade.transaction_type === 'P' ? 'P - Purchase' : 'S - Sale'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-right text-gray-900 dark:text-white w-20 min-w-20">
                    ${trade.price?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-right text-gray-600 dark:text-gray-400 w-24 min-w-24">
                    {trade.transaction_type === 'P' ? '+' : '-'}{formatNumber(trade.quantity)}
                  </TableCell>
                  <TableCell className="text-sm text-right text-gray-600 dark:text-gray-400 w-24 min-w-24">
                    {formatNumber(trade.shares_owned_after)}
                  </TableCell>
                  <TableCell className="text-sm text-right text-gray-600 dark:text-gray-400 w-20 min-w-20">
                    {formatPercent(trade.delta_ownership)}
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium text-gray-900 dark:text-white w-24 min-w-24">
                    {formatValue(trade.transaction_value)}
                  </TableCell>
                  <TableCell className="text-sm text-right text-gray-500 dark:text-gray-500 w-12 min-w-12">
                    -
                  </TableCell>
                  <TableCell className="text-sm text-right text-gray-500 dark:text-gray-500 w-12 min-w-12">
                    -
                  </TableCell>
                  <TableCell className="text-sm text-right text-gray-500 dark:text-gray-500 w-12 min-w-12">
                    -
                  </TableCell>
                  <TableCell className="text-sm text-right text-gray-500 dark:text-gray-500 w-12 min-w-12">
                    -
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
