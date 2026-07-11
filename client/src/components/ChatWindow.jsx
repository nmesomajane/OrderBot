import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import OptionTickets from './OptionTickets';
import { sendChatInput, initPayment } from '../api/chatApi';

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [options, setOptions] = useState([]);
  const [typedInput, setTypedInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const hasInitialized = useRef(false);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  useEffect(() => {
    if (hasInitialized.current) return; // StrictMode runs this effect twice in dev - skip the repeat
    hasInitialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success') {
      appendBotText('Payment successful! Your order is confirmed. ');
    } else if (paymentStatus === 'failed') {
      appendBotText('Payment did not go through. You can try again from the main menu.');
    } else if (paymentStatus === 'error') {
      appendBotText('Something went wrong verifying your payment. Please contact support.');
    }


    if (paymentStatus) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    
    handleSend('__init__', { silent: true });
   
  }, []);

  function appendBotText(text) {
    setMessages((prev) => [...prev, { type: 'bot', text }]);
  }

  async function handleSend(value, { silent } = {}) {
    if (!value) return;
    setLoading(true);

    if (!silent) {
      setMessages((prev) => [...prev, { type: 'user', text: value }]);
    }
    setOptions([]);
    setTypedInput('');

    try {
      const result = await sendChatInput(value);
      setMessages((prev) => [...prev, ...result.messages]);
      setOptions(result.options || []);

      // Special case: bot is offering a "PAY" button after checkout.
      if (result.options?.some((o) => o.value === 'PAY')) {
        // handled by the PAY button branch in the option click below
      }
    } catch (err) {
      appendBotText("Sorry, I couldn't process that. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOptionClick(value) {
    if (value === 'PAY') {
      setLoading(true);
      try {
        const { authorizationUrl } = await initPayment();
        window.location.href = authorizationUrl; // redirect to Paystack checkout
      } catch (err) {
        appendBotText('Could not start payment. Please try again.');
        setLoading(false);
      }
      return;
    }
    handleSend(value);
  }

  function handleTypedSubmit(e) {
    e.preventDefault();
    handleSend(typedInput);
  }

  return (
    <div className="min-h-screen bg-[#171412] flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[85vh] bg-[#0F0D0B] rounded-2xl border border-[#2A241F] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <header className="px-5 py-4 border-b border-[#2A241F] bg-[#171412]">
          <h1 className="font-serif text-2xl text-[#F5EFE6] tracking-tight">ChopChat</h1>
          <p className="text-xs text-[#8A8078] mt-0.5">Order by number. Eat in minutes.</p>
        </header>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          <OptionTickets options={options} onSelect={handleOptionClick} disabled={loading} />
          {loading && <p className="text-xs text-[#8A8078] mt-1">ChopChat is typing…</p>}
          <div ref={bottomRef} />
        </div>

        {/* Free-text fallback input, e.g. for quantity ("2") */}
        <form onSubmit={handleTypedSubmit} className="flex border-t border-[#2A241F] p-3 gap-2">
          <input
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Type a number..."
            className="flex-1 bg-[#1B1815] text-[#F5EFE6] placeholder-[#5C554D] rounded-lg px-3 py-2
                       text-sm outline-none focus:ring-1 focus:ring-[#C6742B]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !typedInput}
            className="bg-[#C6742B] text-[#171412] font-medium text-sm rounded-lg px-4 py-2
                       disabled:opacity-40 hover:bg-[#E2A33D] transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}