// src/components/ChatModal.js
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Button, ListGroup, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaPaperPlane, FaUser, FaComments, FaCheck, FaCheckDouble } from 'react-icons/fa';
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
// FIREBASE REMOVED - TODO: Replace with backend API
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ChatModal({ show, onHide, transactionId, otherUserId, otherUserName }) {
  const [user] = useAuthState(/* auth */ null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!show || !user || !transactionId) return;

    setLoading(true);
    
    // Escuchar mensajes en tiempo real
    const messagesQuery = query(
      collection(/* db */ null, 'chats'),
      where('transactionId', '==', transactionId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setMessages(messageList);
      setLoading(false);
      
      // Marcar mensajes como leídos si no son del usuario actual
      const unreadMessages = messageList.filter(msg => 
        msg.senderId !== user.uid && !msg.read
      );
      
      unreadMessages.forEach(async (msg) => {
        try {
          await updateDoc(doc(/* db */ null, 'chats', msg.id), {
            read: true,
            readAt: new Date()
          });
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });
    });

    return () => unsubscribe();
  }, [show, user, transactionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !transactionId) return;

    setSendingMessage(true);
    try {
      await addDoc(collection(/* db */ null, 'chats'), {
        transactionId,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        receiverId: otherUserId,
        receiverName: otherUserName,
        message: newMessage.trim(),
        read: false,
        createdAt: new Date()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    }
    setSendingMessage(false);
  };

  const formatMessageTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'dd MMM HH:mm', { locale: es });
    }
  };

  if (!show) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      className="glassmorphism-modal"
    >
      <Modal.Header 
        closeButton 
        className="glassmorphism-header border-bottom border-secondary"
      >
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaComments className="text-primary" />
          Chat con {otherUserName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body 
        className="glassmorphism-body p-0"
        style={{ height: '400px', display: 'flex', flexDirection: 'column' }}
      >
        {/* Messages Area */}
        <div 
          className="messages-container flex-grow-1 overflow-auto p-3"
          style={{ 
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(5px)'
          }}
        >
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" />
              <small className="text-light">Cargando mensajes...</small>
            </div>
          ) : messages.length === 0 ? (
            <Alert 
              variant="info" 
              className="text-center"
              style={{
                background: 'rgba(13, 202, 240, 0.1)',
                border: '1px solid rgba(13, 202, 240, 0.3)',
                color: '#0dcaf0'
              }}
            >
              <FaComments className="me-2" />
              Inicia la conversación enviando un mensaje
            </Alert>
          ) : (
            <ListGroup variant="flush">
              {messages.map((message, index) => {
                const isMyMessage = message.senderId === user?.uid;
                const showDate = index === 0 || 
                  (messages[index - 1] && 
                   format(message.createdAt || new Date(), 'yyyy-MM-dd') !== 
                   format(messages[index - 1].createdAt || new Date(), 'yyyy-MM-dd'));

                return (
                  <React.Fragment key={message.id}>
                    {showDate && (
                      <div className="text-center my-2">
                        <small 
                          className="px-2 py-1 rounded"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#ccc'
                          }}
                        >
                          {format(message.createdAt || new Date(), 'dd MMMM yyyy', { locale: es })}
                        </small>
                      </div>
                    )}
                    
                    <ListGroup.Item
                      className={`border-0 p-2 ${isMyMessage ? 'text-end' : 'text-start'}`}
                      style={{ background: 'transparent' }}
                    >
                      <div 
                        className={`d-inline-block p-3 rounded-3 ${
                          isMyMessage ? 'ms-auto' : 'me-auto'
                        }`}
                        style={{
                          maxWidth: '70%',
                          background: isMyMessage ? 
                            'rgba(0, 123, 255, 0.8)' : 
                            'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${isMyMessage ? 
                            'rgba(0, 123, 255, 0.3)' : 
                            'rgba(255, 255, 255, 0.2)'}`
                        }}
                      >
                        <div className="message-content">
                          <p className="mb-1 text-white" style={{ fontSize: '14px' }}>
                            {message.message}
                          </p>
                          <div className={`d-flex align-items-center gap-1 ${isMyMessage ? 'justify-content-end' : 'justify-content-start'}`}>
                            <small className="text-light opacity-75" style={{ fontSize: '11px' }}>
                              {formatMessageTime(message.createdAt)}
                            </small>
                            {isMyMessage && (
                              <div className="ms-1">
                                {message.read ? (
                                  <FaCheckDouble 
                                    size={10} 
                                    className="text-success" 
                                    title="Leído"
                                  />
                                ) : (
                                  <FaCheck 
                                    size={10} 
                                    className="text-light opacity-75" 
                                    title="Enviado"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </ListGroup>
          )}
        </div>

        {/* Message Input */}
        <div 
          className="message-input-area p-3 border-top border-secondary"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Form onSubmit={sendMessage}>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Escribe tu mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sendingMessage}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                className="chat-input"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!newMessage.trim() || sendingMessage}
                style={{
                  minWidth: '60px',
                  background: 'rgba(0, 123, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 123, 255, 0.3)'
                }}
              >
                {sendingMessage ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  <FaPaperPlane />
                )}
              </Button>
            </div>
          </Form>
        </div>
      </Modal.Body>
    </Modal>
  );
}