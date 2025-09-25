'use client';

import { 
  Archive, 
  Tag, 
  Users, 
  TrendingUp, 
  Eye, 
  MessageSquare, 
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatItem {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: React.ReactNode;
  color: string;
}

interface ModernStatsGridProps {
  stats: {
    totalKnowledge: number;
    totalTags: number;
    activeUsers: number;
    monthlyViews: number;
    weeklyGrowth?: number;
    avgResponseTime?: number;
    integrations?: number;
    lastActivity?: string;
  };
}

export function ModernStatsGrid({ stats }: ModernStatsGridProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const statItems: StatItem[] = [
    {
      label: 'Knowledge Items',
      value: formatNumber(stats.totalKnowledge),
      change: {
        value: 12,
        type: 'increase',
        period: 'this month'
      },
      icon: <Archive className="h-6 w-6" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Active Tags',
      value: formatNumber(stats.totalTags),
      change: {
        value: 5,
        type: 'increase',
        period: 'this week'
      },
      icon: <Tag className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Active Users',
      value: formatNumber(stats.activeUsers),
      change: {
        value: 8,
        type: 'increase',
        period: 'this month'
      },
      icon: <Users className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Monthly Views',
      value: formatNumber(stats.monthlyViews),
      change: {
        value: 15,
        type: 'increase',
        period: 'vs last month'
      },
      icon: <Eye className="h-6 w-6" />,
      color: 'from-orange-500 to-red-500'
    },
    {
      label: 'Weekly Growth',
      value: `${stats.weeklyGrowth || 23}%`,
      change: {
        value: 3,
        type: 'increase',
        period: 'vs last week'
      },
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      label: 'Avg Response Time',
      value: `${stats.avgResponseTime || 2.3}s`,
      change: {
        value: 12,
        type: 'decrease',
        period: 'improvement'
      },
      icon: <Clock className="h-6 w-6" />,
      color: 'from-teal-500 to-cyan-500'
    },
    {
      label: 'Active Integrations',
      value: stats.integrations || 4,
      icon: <Zap className="h-6 w-6" />,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      label: 'Team Conversations',
      value: formatNumber(1247),
      change: {
        value: 18,
        type: 'increase',
        period: 'this week'
      },
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'from-rose-500 to-pink-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat, index) => (
        <Card 
          key={stat.label}
          className="arkivame-card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/50"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="arkivame-caption text-gray-600 mb-2">
                  {stat.label}
                </p>
                <p className="arkivame-heading-2 text-gray-900 mb-3">
                  {stat.value}
                </p>
                {stat.change && (
                  <div className="flex items-center space-x-1">
                    {stat.change.type === 'increase' ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`arkivame-caption font-medium ${
                      stat.change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change.value}% {stat.change.period}
                    </span>
                  </div>
                )}
              </div>
              
              <div className={`
                h-12 w-12 rounded-xl flex items-center justify-center text-white
                bg-gradient-to-br ${stat.color} shadow-lg
                group-hover:scale-110 transition-transform duration-300
              `}>
                {stat.icon}
              </div>
            </div>
            
            {/* Progress bar for visual appeal */}
            <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 ease-out`}
                style={{ 
                  width: `${Math.min(100, (index + 1) * 20 + Math.random() * 30)}%`,
                  animationDelay: `${index * 100}ms`
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

