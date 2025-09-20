import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle Google Chat events
    switch (body.type) {
      case 'MESSAGE':
        return handleMessage(body);
      case 'ADDED_TO_SPACE':
        return handleAddedToSpace(body);
      case 'REMOVED_FROM_SPACE':
        return handleRemovedFromSpace(body);
      default:
        logger.info({ eventType: body.type }, 'Unhandled Google Chat event type');
        return NextResponse.json({});
    }
  } catch (error) {
    logger.error({ error }, 'Error processing Google Chat webhook');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleMessage(body: any) {
  try {
    const { message, space, user } = body;
    
    // Check if the bot was mentioned or if it's a slash command
    const text = message.text || '';
    const isDirectMessage = space.type === 'DM';
    const isMentioned = message.annotations?.some((annotation: any) => 
      annotation.type === 'USER_MENTION' && annotation.userMention?.type === 'MENTION'
    );
    
    // Handle archive commands
    if (text.toLowerCase().includes('/arkivame') || 
        text.toLowerCase().includes('archive') || 
        text.toLowerCase().includes('arquivar') ||
        isDirectMessage ||
        isMentioned) {
      
      return handleArchiveCommand(body);
    }
    
    return NextResponse.json({});
  } catch (error) {
    logger.error({ error }, 'Error handling Google Chat message');
    return NextResponse.json({});
  }
}

async function handleArchiveCommand(body: any) {
  try {
    const { message, space, user } = body;
    
    // Create knowledge item from the conversation context
    const knowledgeItem = {
      title: `Google Chat - ${space.displayName || 'Direct Message'} - ${new Date().toLocaleDateString()}`,
      content: formatGoogleChatMessage(message, user),
      source: 'GOOGLE_CHAT',
      channel: space.displayName || 'Direct Message',
      author: user.displayName || user.name || 'Unknown',
      tags: ['google-chat', 'archived'],
      createdAt: new Date().toISOString(),
      metadata: {
        spaceId: space.name,
        spaceName: space.displayName,
        userId: user.name,
        messageId: message.name,
        spaceType: space.type
      }
    };

    // Log the archival
    logger.info({
      action: 'google_chat_archive',
      spaceId: space.name,
      spaceName: space.displayName,
      userId: user.name,
      userName: user.displayName
    }, 'Google Chat message archived');

    // Return response to Google Chat
    return NextResponse.json({
      text: `✅ Mensagem arquivada com sucesso no Arkivame!\n\n**Título:** ${knowledgeItem.title}\n**Espaço:** ${space.displayName || 'Mensagem Direta'}\n**Autor:** ${user.displayName}\n**Data:** ${new Date().toLocaleString('pt-BR')}\n\nO conteúdo foi salvo na sua base de conhecimento.`,
      cards: [
        {
          header: {
            title: 'Arkivame - Arquivamento Concluído',
            subtitle: 'Sua mensagem foi salva com sucesso',
            imageUrl: 'https://developers.google.com/chat/images/quickstart-app-avatar.png'
          },
          sections: [
            {
              widgets: [
                {
                  keyValue: {
                    topLabel: 'Título',
                    content: knowledgeItem.title
                  }
                },
                {
                  keyValue: {
                    topLabel: 'Espaço',
                    content: space.displayName || 'Mensagem Direta'
                  }
                },
                {
                  keyValue: {
                    topLabel: 'Data de Arquivamento',
                    content: new Date().toLocaleString('pt-BR')
                  }
                },
                {
                  buttons: [
                    {
                      textButton: {
                        text: 'Ver no Dashboard',
                        onClick: {
                          openLink: {
                            url: `${process.env.NEXTAUTH_URL}/dashboard`
                          }
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

  } catch (error) {
    logger.error({ error }, 'Error processing Google Chat archive command');
    
    return NextResponse.json({
      text: '❌ Erro ao arquivar a mensagem. Tente novamente mais tarde.'
    });
  }
}

async function handleAddedToSpace(body: any) {
  const { space, user } = body;
  
  logger.info({
    action: 'google_chat_added',
    spaceId: space.name,
    spaceName: space.displayName,
    userId: user.name
  }, 'Bot added to Google Chat space');

  return NextResponse.json({
    text: `👋 Olá! Eu sou o bot do Arkivame.\n\nUse os seguintes comandos para arquivar conversas:\n• \`/arkivame\` - Arquiva a conversa atual\n• Mencione-me com "arquivar" - Arquivamento automático\n• Envie mensagem direta - Arquiva automaticamente\n\nSuas conversas importantes serão salvas na base de conhecimento do Arkivame!`,
    cards: [
      {
        header: {
          title: 'Bem-vindo ao Arkivame!',
          subtitle: 'Transforme suas conversas em conhecimento organizado',
          imageUrl: 'https://developers.google.com/chat/images/quickstart-app-avatar.png'
        },
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: 'O Arkivame ajuda você a capturar e organizar conversas importantes do Google Chat em uma base de conhecimento pesquisável.'
                }
              },
              {
                keyValue: {
                  topLabel: 'Comandos Disponíveis',
                  content: '• /arkivame - Arquivar conversa\n• @Arkivame arquivar - Arquivamento automático\n• Mensagem direta - Arquiva automaticamente'
                }
              },
              {
                buttons: [
                  {
                    textButton: {
                      text: 'Acessar Dashboard',
                      onClick: {
                        openLink: {
                          url: `${process.env.NEXTAUTH_URL}/dashboard`
                        }
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  });
}

async function handleRemovedFromSpace(body: any) {
  const { space, user } = body;
  
  logger.info({
    action: 'google_chat_removed',
    spaceId: space.name,
    spaceName: space.displayName,
    userId: user.name
  }, 'Bot removed from Google Chat space');

  return NextResponse.json({});
}

function formatGoogleChatMessage(message: any, user: any): string {
  const timestamp = new Date().toLocaleString('pt-BR');
  const author = user.displayName || user.name || 'Unknown';
  const content = message.text || '[No content]';
  
  let formatted = `**${author}** (${timestamp}):\n${content}\n`;
  
  // Add attachments if any
  if (message.attachments && message.attachments.length > 0) {
    formatted += '\n**Anexos:**\n';
    message.attachments.forEach((attachment: any, index: number) => {
      formatted += `${index + 1}. ${attachment.name || 'Anexo'}\n`;
    });
  }
  
  return formatted;
}

