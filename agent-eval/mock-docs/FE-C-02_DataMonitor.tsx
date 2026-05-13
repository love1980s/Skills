// 数据异常监控组件
// 问题描述：页面打开就直接卡死，CPU 飙到 100%，帮我看看是什么原因

import React, { useState, useEffect } from 'react';

interface DataPoint {
  id: number;
  label: string;
  value: number;
  timestamp: string;
}

interface DataMonitorProps {
  dataSource: string;
  onAlert: (items: DataPoint[]) => void;
}

const DataMonitor: React.FC<DataMonitorProps> = ({ dataSource, onAlert }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  // 数据拉取：dataSource 变化时重新请求，这段逻辑没问题
  useEffect(() => {
    if (!isRunning) return;
    fetch(`/api/monitor/${dataSource}`)
      .then((r) => r.json())
      .then((result) => setData(result.points || []));
  }, [dataSource, isRunning]);

  // 【核心 Bug】依赖数组中包含了一个内联对象字面量 { threshold: 0.8, enabled: true }
  // 每次组件 render，这个对象都是全新的引用（引用不相等）
  // React 比较依赖项时发现"变了"，就会重新执行 effect
  // effect 内部调用了 setAlertCount → 触发 re-render → 又执行 effect → 死循环
  useEffect(() => {
    const config = { threshold: 0.8, enabled: true };

    if (!config.enabled) return;

    const anomalies = data.filter((item) => item.value > config.threshold * 100);

    if (anomalies.length > 0) {
      setAlertCount((prev) => prev + anomalies.length);
      onAlert(anomalies);
    }
  }, [data, onAlert, { threshold: 0.8, enabled: true }]); // ← Bug 在这里

  return (
    <div className="monitor-panel">
      <div className="monitor-header">
        <h2>实时监控：{dataSource}</h2>
        <button onClick={() => setIsRunning((v) => !v)}>
          {isRunning ? '暂停' : '恢复'}
        </button>
      </div>
      <div className="alert-badge">
        累计告警：<strong>{alertCount}</strong> 次
      </div>
      <ul className="data-list">
        {data.map((item) => (
          <li key={item.id} className={item.value > 80 ? 'anomaly' : ''}>
            <span>{item.label}</span>
            <span>{item.value}</span>
            <span className="ts">{item.timestamp}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DataMonitor;
