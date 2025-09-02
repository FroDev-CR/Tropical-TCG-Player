// src/pages/DatabaseReset.js
// Página temporal para ejecutar limpieza de base de datos

import React, { useState } from 'react';
import { Container, Card, Button, Alert, ProgressBar, Form } from 'react-bootstrap';
import { resetDatabaseForP2P, cleanDatabase, createInitialStructures } from '../scripts/cleanDatabase';

export default function DatabaseReset() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const handleReset = async () => {
    if (confirmation !== 'CONFIRMAR RESET') {
      setError('Debes escribir "CONFIRMAR RESET" para proceder');
      return;
    }

    setLoading(true);
    setProgress(0);
    setMessage('');
    setError('');
    setSuccess(false);

    try {
      setMessage('🧹 Iniciando limpieza de base de datos...');
      setProgress(20);

      await cleanDatabase();
      setMessage('✅ Base de datos limpiada exitosamente');
      setProgress(60);

      setMessage('🏗️ Creando estructuras iniciales...');
      await createInitialStructures();
      setProgress(80);

      setMessage('🎉 Reset completo exitoso!');
      setProgress(100);
      setSuccess(true);

    } catch (error) {
      console.error('Error en reset:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '600px' }}>
        <Card.Header className="bg-danger text-white">
          <h4 className="mb-0">⚠️ Reset de Base de Datos</h4>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning">
            <Alert.Heading>🚨 ADVERTENCIA</Alert.Heading>
            <p>
              Esta acción eliminará <strong>TODOS</strong> los datos de la base de datos:
            </p>
            <ul>
              <li>Todos los usuarios</li>
              <li>Todos los listings</li>
              <li>Todas las transacciones</li>
              <li>Todas las notificaciones</li>
              <li>Todos los binders</li>
              <li>Todos los ratings</li>
            </ul>
            <p className="mb-0">
              <strong>Esta acción NO se puede deshacer.</strong>
            </p>
          </Alert>

          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <Alert.Heading>🎉 ¡Reset Exitoso!</Alert.Heading>
              <p>La base de datos ha sido limpiada completamente.</p>
              <p>Ahora puedes:</p>
              <ul>
                <li>Crear una nueva cuenta de usuario</li>
                <li>Crear nuevos listings con la estructura P2P</li>
                <li>Probar el flujo completo de transacciones</li>
              </ul>
            </Alert>
          )}

          {!success && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>
                  Para confirmar, escribe: <strong>CONFIRMAR RESET</strong>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Escribe: CONFIRMAR RESET"
                  disabled={loading}
                />
              </Form.Group>

              <Button
                variant="danger"
                onClick={handleReset}
                disabled={loading || confirmation !== 'CONFIRMAR RESET'}
                className="w-100"
              >
                {loading ? '🔄 Ejecutando Reset...' : '🗑️ Ejecutar Reset Completo'}
              </Button>
            </>
          )}

          {loading && (
            <div className="mt-3">
              <div className="mb-2">{message}</div>
              <ProgressBar now={progress} label={`${progress}%`} />
            </div>
          )}

          <hr />
          
          <div className="text-muted small">
            <h6>📋 Qué hace este reset:</h6>
            <ol>
              <li><strong>Limpia collections:</strong> users, listings, transactions, notifications, ratings, disputes, binders</li>
              <li><strong>Prepara estructuras:</strong> Ready para el sistema P2P</li>
              <li><strong>Estado final:</strong> Base de datos completamente limpia</li>
            </ol>
            
            <h6 className="mt-3">🚀 Después del reset:</h6>
            <ol>
              <li>Crear cuenta de usuario nueva</li>
              <li>Crear listings de prueba</li>
              <li>Probar flujo P2P completo</li>
            </ol>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}