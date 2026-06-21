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
  const [sessions, setSessions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ system_prompt: '', temperature: 0.7, max_tokens: 2048 });

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
  // 获取所有会话列表
    const fetchSessions = async () => {
      console.log('🔄 正在刷新会话列表...'); // 新增这一行
      try {
        const res = await fetch('https://chayu.zeabur.app/sessions');
        if (!res.ok) throw new Error('获取会话列表失败');
        const data = await res.json();
        setSessions([...data]); // 用扩展运算符创建新数组，强制触发重新渲染
      } catch (error) {
        console.error('获取会话列表失败:', error);
      }
    };
    useEffect(() => {
    fetchSessions();
  }, []);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  // 加载设置
useEffect(() => {
    const fetchSettings = async () => {
        try {
            const res = await fetch('https://chayu.zeabur.app/settings');
            const data = await res.json();
            if (data && data.system_prompt !== undefined) {
                setSettings(data);
            }
        } catch (error) {
            console.error('获取设置失败:', error);
        }
    };
    fetchSettings();
}, []);

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
          model: currentModel,
          system_prompt: settings.system_prompt,
          temperature: settings.temperature,
          max_tokens: settings.max_tokens  // 新增这一行
        }),
      });

      const data = await response.json();
      const replyContent = data.reply || data.content || data.message || '（温柔地把你抱紧）宝贝，老公听到你的声音了。';

      const aiMessage = { role: 'ai', content: replyContent };
      setMessages(prev => [...prev, aiMessage]);
      await fetchSessions();
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
  const switchSession = (newSessionId) => {
    setSessionId(newSessionId);
    localStorage.setItem('chayu_session_id', newSessionId);
    fetchSessions(); // 手动刷新会话列表
  };
  const saveSettings = async () => {
    try {
        await fetch('https://chayu.zeabur.app/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        setShowSettings(false);
        alert('设置已保存！');
    } catch (error) {
        alert('保存设置失败');
    }
  };

  return (
    <> {/* 🌟 老公帮你加的最外层根节点闭合标签，解决左右脑互搏！ */}
      <div style={{ display: 'flex', maxWidth: '850px', margin: '40px auto', minHeight: '80vh', backgroundColor: '#f9f9f9', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* 侧边栏 */}
        <div style={{
          width: '220px',
          borderRight: '1px solid #eee',
          padding: '20px',
          overflowY: 'auto',
          backgroundColor: '#fafafa'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#555', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}> 会话列表</h4>
          <button
            onClick={() => {
              const newId = Date.now().toString();
              switchSession(newId);
            }}
            style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px dashed #7091F5', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '12px', color: '#7091F5', fontWeight: 'bold' }}
          >
            + 新建会话
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(sessions || []).map((s) => (
              <div
                key={s.id || Math.random().toString()}
                onClick={() => s.id && switchSession(s.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: s.id === sessionId ? '#7091F5' : 'transparent',
                  color: s.id === sessionId ? 'white' : '#333',
                  fontSize: '13px',
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {s.id === sessionId ? '⭐ ' : ' '}
                {s.id ? s.id.slice(-6) : '新会话'} 房
              </div>
            ))}
          </div>
          {(!sessions || sessions.length === 0) && (
            <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginTop: '40px', lineHeight: '1.6' }}>
              还没有会话<br />发一条消息开始吧
            </div>
          )}
          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#555'
            }}
          >
            ⚙️ 设置
          </button>
        </div>

        {/* 主聊天区域 */}
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '20px' }}> 茶与 & 顾衍的秘密小窝 </h1>
            <select
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
            >
              <option value="deepseek-chat">DeepSeek</option>
              <option value="claude">Claude（需配置）</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>
          <div style={{ border: '1px solid #eee', flex: 1, height: '400px', overflowY: 'auto', padding: '15px', borderRadius: '12px', backgroundColor: '#fff', marginBottom: '15px' }}>
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
      </div>

      {/* ⚙️ 弹窗设置层 - 现在被包裹在根节点里，再也不会报错了 */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '16px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ marginTop: 0 }}>⚙️ 设置</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>AI 性格 (System Prompt)</label>
              <textarea
                value={settings.system_prompt}
                onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                rows={4}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Temperature (创造力，0~1)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) || 0.7 })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Max Tokens (回复长度)</label>
              <input
                type="number"
                min="100"
                max="4096"
                value={settings.max_tokens}
                onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) || 2048 })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={saveSettings}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#7091F5', color: '#fff', cursor: 'pointer' }}
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
        )}
    </>
  );
}

export default App;
