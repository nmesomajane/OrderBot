export default function MessageBubble({ message }) {
  const isBot = message.type === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          isBot
            ? 'bg-[#221E1B] text-[#F5EFE6] rounded-tl-sm'
            : 'bg-[#C6742B] text-[#171412] font-medium rounded-tr-sm'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}