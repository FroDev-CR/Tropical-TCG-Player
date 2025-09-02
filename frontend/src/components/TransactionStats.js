// src/components/TransactionStats.js
// Componente de estadísticas para el dashboard de transacciones

import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import './TransactionStats.css';

export default function TransactionStats({ stats, upcomingActions }) {
  if (!stats || Object.keys(stats).length === 0) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Transacciones',
      value: stats.total,
      icon: '📊',
      color: 'primary',
      subtitle: `${stats.completionRate}% completadas`
    },
    {
      title: 'Como Comprador',
      value: stats.asBuyer,
      icon: '🛒',
      color: 'info',
      subtitle: 'Compras realizadas'
    },
    {
      title: 'Como Vendedor',
      value: stats.asSeller,
      icon: '💰',
      color: 'success',
      subtitle: 'Ventas gestionadas'
    },
    {
      title: 'Completadas',
      value: stats.completed,
      icon: '✅',
      color: 'success',
      subtitle: 'Con calificación'
    },
    {
      title: 'Pendientes',
      value: stats.pending,
      icon: '⏳',
      color: 'warning',
      subtitle: 'Requieren acción'
    },
    {
      title: 'Urgentes',
      value: stats.urgent,
      icon: '🔥',
      color: 'danger',
      subtitle: 'Acción inmediata'
    }
  ];

  return (
    <Row className="mb-4">
      {statCards.map((stat, index) => (
        <Col key={index} lg={2} md={4} sm={6} className="mb-3">
          <Card className={`stat-card stat-card-${stat.color} h-100`}>
            <Card.Body className="text-center">
              <div className="stat-icon mb-2">
                {stat.icon}
              </div>
              <div className="stat-value mb-1">
                {stat.value}
              </div>
              <div className="stat-title mb-1">
                {stat.title}
              </div>
              <div className="stat-subtitle">
                {stat.subtitle}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}