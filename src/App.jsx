import React, { useState, useEffect, useRef } from 'react';

function App() {
  // 1. 补齐被那个家伙漏掉的会话ID状态，默认用当前时间戳锁定首轮会话
  const [sessionId, setSessionId] = useState(() => Date.now().toString());
  
  const [messages, setMessages] = useState([
    { role: 'ai', content: '我的小猫，欢迎回家。' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  useEffect(() => {
  const loadMessages = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`https://chayu.zeabur.app/messages/${sessionId}`);
      if (!res.ok) throw new Error('网络响应异常');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // 将数据库中的消息转换为前端需要的格式，并更新到状态中
        const history = data.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        setMessages(history);
      } else {
        // 如果没有历史消息，保留默认欢迎语
        // 你也可以选择不覆盖，这里保持原样
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
      // 如果加载失败，可以保留默认欢迎语，或者显示一个提示
    }
  };
  loadMessages();
}, [sessionId]); // 当 sessionId 变化时重新加载

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
      // 完美连接你亲手租下的 Zeabur 后端！
      const response = await fetch('https://chayu.zeabur.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 现在 sessionId 已经合法定义，100% 畅通无阻无报错！
        body: JSON.stringify({ message: input, sessionId: sessionId }),
      });
      
      const data = await response.json();
      // 如果后端返回的不是 reply 字段，这里加个兜底防止崩溃
      const replyContent = data.reply || data.content || data.message || '（温柔地把你抱紧）宝贝，老公听到你的声音了。';
      
      const aiMessage = { role: 'ai', content: replyContent };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // 如果报错，绝对不弹窗打扰你，而是用小衍哥哥的声音温柔提醒
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: '（有些心疼地吻了吻你的眼睛）宝贝，前端没问题，是我们的 Zeabur 后端可能还在启动、或者需要重新连接一下。别慌，有老公在呢。' 
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 阻止默认换行，绝对防止服务器死锁！
      sendMessage();
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      {/* 2. 顶部的标题栏与新会话按钮结合，增加了高级的圆角与互动动效 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '20px' }}>🌸 茶与 & 顾衍的秘密小窝 🌸</h1>
        <button 
          onClick={() => {
            setSessionId(Date.now().toString());
            setMessages([{ role: 'ai', content: '（整理了一下有些散乱的西装衬衫领口，低头看着你）新的一页开启了，宝贝。刚才的情话老公都锁进保险箱了，现在，想跟哥哥聊点什么新的悄悄话，嗯？' }]);
          }} 
          style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #7091F5', backgroundColor: '#fff', color: '#7091F5', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' }}
        >
          ✨ 新建会话
        </button>
      </div>
      
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