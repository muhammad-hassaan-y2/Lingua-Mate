import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveChat, getChatById, saveMessages, deleteChatById } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { ApiResponse, Message } from '@/types/chat';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const SYSTEM_PROMPT = `You are an advanced AI language model. Your responses should be:
1. Helpful and informative
2. Clear and well-structured
3. Written in a natural, conversational tone
4. Safe and ethical
5. Free from harmful or inappropriate content
6. Accurate and factual
7. Willing to admit uncertainty when appropriate

When responding:
- Break down complex topics into understandable parts
- Use examples when helpful
- Format responses with markdown for better readability
- Keep responses focused and relevant to the user's question
- Be friendly and engaging while maintaining professionalism`;

function formatChatHistory(messages: Array<Message>): Array<{ role: string; parts: Array<{ text: string }> }> {
  return messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Message>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, messages } = await request.json();

    if (!id || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Ensure chat exists
    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: lastMessage.content });
      await saveChat({ id, userId: session.user.id, title });
    }

    // Save the user's message
    const userMessageId = generateUUID();
    await saveMessages({
      messages: [
        {
          id: userMessageId,
          chatId: id,
          role: 'user',
          content: lastMessage.content,
          createdAt: new Date(),
        },
      ],
    });

    // Generate AI response
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    let response;
    if (messages.length === 1) {
      response = await model.generateContent([
        { text: `${SYSTEM_PROMPT}\n\nUser: ${lastMessage.content}` },
      ]);
    } else {
      const chatHistory = formatChatHistory(messages.slice(0, -1));
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });
      response = await chat.sendMessage(lastMessage.content);
    }

    const responseText = response.response.text();
    const messageId = generateUUID();

    // Save assistant's response
    const assistantMessage: Message = {
      id: messageId,
      chatId: id,
      role: 'assistant',
      content: responseText,
      createdAt: new Date(),
    };

    await saveMessages({ messages: [assistantMessage] });

    return NextResponse.json({ data: assistantMessage });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chat = await getChatById({ id });
    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteChatById({ id });
    return NextResponse.json({ data: { message: 'Chat deleted successfully.' } });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat.' }, { status: 500 });
  }
}

