import { APIInteraction } from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';

/**
 * Verifies the signature of a Discord interaction request.
 * @param request The incoming Request object.
 * @returns An object containing whether the request is valid and the parsed interaction body.
 */
export async function verifyDiscordRequest(
  request: Request,
): Promise<{ isValid: boolean; interaction: APIInteraction | null }> {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();

  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!signature || !timestamp || !publicKey) {
    return { isValid: false, interaction: null };
  }

  const isValid = verifyKey(body, signature, timestamp, publicKey);

  if (!isValid) {
    return { isValid: false, interaction: null };
  }

  return { isValid: true, interaction: JSON.parse(body) };
}

/**
 * Registers slash commands with Discord.
 * This should be run once during application setup.
 */
/*
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

export async function registerDiscordCommands(appId: string, token: string) {
  const rest = new REST({ version: '10' }).setToken(token);
  const commands = [{ name: 'arkivame', description: 'Arquiva a thread ou mensagem atual no Arkivame.' }];
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(appId), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Failed to register Discord commands:', error);
  }
}
*/