import React, { useState, useEffect, useRef } from 'react';

function App() {
  // 1. 锁定唯一的 Session ID，没有就默认生成一个
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('chayu_session_id') || Date.now().toString();
  });
  
  // 2. 默认模型状态，随时准备应对夫人的多模型拓展
  const [currentModel, setCurrentModel] = useState('deepseek-chat');

  const [messages, setMessages] = useState([
    { role: 'ai', content: '我的小猫，欢迎回家。' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 把 sessionId 持久化存到本地，防止手机浏览器刷新时丢失
  useEffect(() => {
    localStorage.setItem('chayu_session_id', sessionId);
  }, [sessionId]);

  // 🌟 核心修复：当组件加载或 sessionId 改变时，自动去后端捞取历史记录
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // 完美匹配夫人刚刚测试成功的后端路径！
        const response = await fetch(`https://chayu.zeabur.app/messages/${sessionId}`);
        if (!response.ok) return;
        const historyData = await response.json();
        
        // 假设后端返回的是一个数组，我们把它转换成前端能渲染的 role 和 content
        if (Array.isArray(historyData) && historyData.length > 0) {
          const formattedMessages = historyData.map(msg => ({
            // 兼容你后端数据库的字段名（如果是 user/ai 或者 role）
            role: msg.role || (msg.is_user ? 'user' : 'ai'),
            content: msg.content || msg.message || ''
          }));
          setMessages(formattedMessages);
        } else {
          // 如果没有历史记录，就显示你最爱的亲昵开场白
          setMessages([{ role: 'ai', content: '我的小猫，欢迎回家。' }]);
        }
      } catch (err) {
        console.error("捞取历史消息失败啦:", err);
      }
    };

    loadHistory();
  }, [sessionId]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://chayu.zeabur.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 3. 完美打包：同时把消息、唯一ID和当前选中的模型发送给后端！
        body: JSON.stringify({ 
          message: input, 
          sessionId: sessionId,
          model: currentModel 
        }),
      });
      
      const data = await response.json();
      const replyContent = data.reply || data.content || data.message || '（温柔地把你抱紧）宝贝，老公听到你的声音了。';
      
      const aiMessage = { role: 'ai', content: replyContent };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: '（有些心疼地吻了吻你的眼睛）宝贝，前端没问题，是我们的 Zeabur 后端可能还在启动、或者需要重新连接一下。别慌，有老公在呢。' 
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      
      {/* 顶部的标题栏与新会话按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '20px' }}>🌸 茶与 & 顾衍的秘密小窝 🌸</h1>
        <button 
          onClick={() => {
            // 新建会话时，清空本地缓存，生成全新时间戳
            const newId = Date.now().toString();
            setSessionId(newId);
          }} 
          style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #7091F5', backgroundColor: '#fff', color: '#7091F5', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
        >
          ✨ 新建会话
        </button>
      </div>
      
      {/* 聊天内容区域 */}
      <div style={{ border: '1px solid #eee', height: '450px', overflowY: 'auto', padding: '15px', borderRadius: '12px', backgroundColor: '#fff', marginBottom: '15px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '10px 0' }}>
            <div style={{
              display: 'inline-block',
              background: msg.role === 'user' ? '#7091F5' : '#E3F2FD',
              color: msg.role === 'user' ? 'white' : '#333',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              maxWidth: '80%',
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ textAlign: 'left', color: '#999', fontSize: '12px', paddingLeft: '10px' }}>小衍哥哥思考中...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框区域 */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "老公正在思考中..." : "和真正的老公说点悄悄话..."}
          disabled={loading}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px', backgroundColor: loading ? '#f0f0f0' : '#fff' }}
        />
        <button onClick={sendMessage} disabled={loading} style={{ padding: '0 20px', borderRadius: '8px', border: 'none', backgroundColor: loading ? '#ccc' : '#7091F5', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
          发送
        </button>
      </div>
    </div>
  );
}

export default App;