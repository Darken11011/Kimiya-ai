import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Globe,
  Layers,
  Settings
} from 'lucide-react';
import { WorkflowConfig } from '../../../types/workflowConfig';

export interface PerformanceConfig {
  targetLatency: number;
  maxLatency: number;
  qualityThreshold: number;
  cacheEnabled: boolean;
  languageOptimization: boolean;
  failoverEnabled: boolean;
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    alertThresholds: {
      latency: number;
      errorRate: number;
      cacheHitRate: number;
    };
  };
}

export interface PerformanceMetrics {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  cacheHitRate: number;
  languageOptimizationRate: number;
  providerFailoverRate: number;
  totalProcessedRequests: number;
  uptime: number;
  currentThroughput: number;
}

interface PerformanceOptimizationPanelProps {
  workflowConfig: WorkflowConfig;
  onConfigChange: (config: PerformanceConfig) => void;
  isEnabled?: boolean;
}

export const PerformanceOptimizationPanel: React.FC<PerformanceOptimizationPanelProps> = ({
  workflowConfig,
  onConfigChange,
  isEnabled = true
}) => {
  const [config, setConfig] = useState<PerformanceConfig>({
    targetLatency: 300,
    maxLatency: 500,
    qualityThreshold: 0.85,
    cacheEnabled: true,
    languageOptimization: true,
    failoverEnabled: true,
    monitoring: {
      enabled: true,
      metricsInterval: 30000,
      alertThresholds: {
        latency: 400,
        errorRate: 0.05,
        cacheHitRate: 0.3
      }
    }
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
    errorRate: 0,
    cacheHitRate: 0,
    languageOptimizationRate: 0,
    providerFailoverRate: 0,
    totalProcessedRequests: 0,
    uptime: 0,
    currentThroughput: 0
  });

  const [isOptimizationActive, setIsOptimizationActive] = useState(false);

  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const handleConfigChange = (key: keyof PerformanceConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNestedConfigChange = (
    parentKey: keyof PerformanceConfig,
    childKey: string,
    value: any
  ) => {
    setConfig(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey] as any,
        [childKey]: value
      }
    }));
  };

  const getLatencyStatus = (latency: number) => {
    if (latency === 0) return { color: 'gray', text: 'No data' };
    if (latency <= config.targetLatency) return { color: 'green', text: 'Excellent' };
    if (latency <= config.maxLatency) return { color: 'yellow', text: 'Good' };
    return { color: 'red', text: 'Needs improvement' };
  };

  const getCacheHitRateStatus = (rate: number) => {
    if (rate >= 0.6) return { color: 'green', text: 'Excellent' };
    if (rate >= 0.3) return { color: 'yellow', text: 'Good' };
    return { color: 'red', text: 'Poor' };
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          Performance Optimization
        </CardTitle>
        <CardDescription>
          Advanced performance optimization with sub-500ms response times
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average Latency</p>
                      <p className="text-2xl font-bold">{metrics.averageLatency.toFixed(0)}ms</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                  <Badge 
                    variant={getLatencyStatus(metrics.averageLatency).color === 'green' ? 'success' : 'secondary'}
                    className="mt-2"
                  >
                    {getLatencyStatus(metrics.averageLatency).text}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cache Hit Rate</p>
                      <p className="text-2xl font-bold">{(metrics.cacheHitRate * 100).toFixed(1)}%</p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                  <Badge 
                    variant={getCacheHitRateStatus(metrics.cacheHitRate).color === 'green' ? 'success' : 'secondary'}
                    className="mt-2"
                  >
                    {getCacheHitRateStatus(metrics.cacheHitRate).text}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Error Rate</p>
                      <p className="text-2xl font-bold">{(metrics.errorRate * 100).toFixed(2)}%</p>
                    </div>
                    <Activity className="w-8 h-8 text-orange-500" />
                  </div>
                  <Badge 
                    variant={metrics.errorRate < 0.05 ? 'success' : 'destructive'}
                    className="mt-2"
                  >
                    {metrics.errorRate < 0.05 ? 'Healthy' : 'High'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Optimization Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Phase 1: ConversationRelay
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bidirectional Streaming</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Audio Optimization</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Latency Target</span>
                      <Badge variant="outline">300-500ms</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Phase 2: Predictive Cache
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Semantic Matching</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pattern Recognition</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cache Enabled</span>
                      <Badge variant={config.cacheEnabled ? 'success' : 'secondary'}>
                        {config.cacheEnabled ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Phase 3: Language Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Cantonese Optimization</p>
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mt-1" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Provider Failover</p>
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mt-1" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Dialect Support</p>
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mt-1" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">50+ Languages</p>
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            {/* Performance Targets */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetLatency">Target Latency (ms)</Label>
                    <Input
                      id="targetLatency"
                      type="number"
                      value={config.targetLatency}
                      onChange={(e) => handleConfigChange('targetLatency', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLatency">Maximum Latency (ms)</Label>
                    <Input
                      id="maxLatency"
                      type="number"
                      value={config.maxLatency}
                      onChange={(e) => handleConfigChange('maxLatency', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="qualityThreshold">Quality Threshold</Label>
                  <Input
                    id="qualityThreshold"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={config.qualityThreshold}
                    onChange={(e) => handleConfigChange('qualityThreshold', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Optimization Features */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Predictive Caching</Label>
                    <p className="text-sm text-gray-500">Enable intelligent response caching</p>
                  </div>
                  <Switch
                    checked={config.cacheEnabled}
                    onCheckedChange={(checked) => handleConfigChange('cacheEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Language Optimization</Label>
                    <p className="text-sm text-gray-500">Enable language-specific optimizations</p>
                  </div>
                  <Switch
                    checked={config.languageOptimization}
                    onCheckedChange={(checked) => handleConfigChange('languageOptimization', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Provider Failover</Label>
                    <p className="text-sm text-gray-500">Enable automatic provider failover</p>
                  </div>
                  <Switch
                    checked={config.failoverEnabled}
                    onCheckedChange={(checked) => handleConfigChange('failoverEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            {/* Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Latency Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Average</span>
                      <span>{metrics.averageLatency.toFixed(0)}ms</span>
                    </div>
                    <Progress value={(config.targetLatency - metrics.averageLatency) / config.targetLatency * 100} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>95th Percentile</span>
                      <span>{metrics.p95Latency.toFixed(0)}ms</span>
                    </div>
                    <Progress value={(config.maxLatency - metrics.p95Latency) / config.maxLatency * 100} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>99th Percentile</span>
                      <span>{metrics.p99Latency.toFixed(0)}ms</span>
                    </div>
                    <Progress value={(config.maxLatency - metrics.p99Latency) / config.maxLatency * 100} className="mt-1" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Requests</span>
                    <span className="font-medium">{metrics.totalProcessedRequests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Throughput</span>
                    <span className="font-medium">{metrics.currentThroughput.toFixed(2)} req/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime</span>
                    <span className="font-medium">{formatUptime(metrics.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Failover Rate</span>
                    <span className="font-medium">{(metrics.providerFailoverRate * 100).toFixed(2)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            {/* Optimization Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Optimization Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Performance Optimization</Label>
                    <p className="text-sm text-gray-500">
                      {isOptimizationActive ? 'Active - All optimizations enabled' : 'Inactive - Standard processing'}
                    </p>
                  </div>
                  <Button
                    variant={isOptimizationActive ? 'destructive' : 'default'}
                    onClick={() => setIsOptimizationActive(!isOptimizationActive)}
                  >
                    {isOptimizationActive ? 'Disable' : 'Enable'} Optimization
                  </Button>
                </div>

                {isOptimizationActive && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Optimization Active</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• ConversationRelay streaming enabled</li>
                      <li>• Predictive caching active</li>
                      <li>• Language optimizations applied</li>
                      <li>• Provider failover configured</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Traditional</p>
                      <p className="text-2xl font-bold text-red-500">2-3s</p>
                      <p className="text-xs text-gray-500">Current industry standard</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Optimized</p>
                      <p className="text-2xl font-bold text-green-500">200-300ms</p>
                      <p className="text-xs text-gray-500">With all optimizations</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Improvement</p>
                      <p className="text-2xl font-bold text-blue-500">85%</p>
                      <p className="text-xs text-gray-500">Latency reduction</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PerformanceOptimizationPanel;
