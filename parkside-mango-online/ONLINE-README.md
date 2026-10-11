# Parkside Streets — Online Edition

This is a copy of `parkside-mango-edition` under its own address. The original was not edited.

## Multiplayer
1. Open the Online Edition on both devices.
2. Select **Multiplayer** on the main menu or pause screen.
3. Host selects one of 24 lots or Secret City, chooses their character, and selects **Create online room**.
4. Share the **MP-XXXX-XXXX-XXXX** room code or invite link with the other player.
5. Guest chooses a character, enters the code or opens the invite link, then clicks **Join a room**.
6. After connecting, both players enter the host's chosen level. The existing web/gun combat, health, scoring, knockouts and respawns are retained.
7. If online matchmaking fails, expand **Local manual pairing** to use the original offer/reply process on the same Wi-Fi.

## Networking notes
The game is served as static GitHub Pages and uses public PeerJS Cloud signaling with STUN discovery. The game state itself travels over a peer-to-peer WebRTC data channel. This relies on external network services, which can fail or change. Without a TURN relay, restrictive NAT/firewalls or isolated Wi-Fi networks can block connection. No background matchmaking, Bluetooth discovery or automatically detected nearby users is implemented. This version is for two players, not massive multiplayer.

## Testing
Check room creation, invite links, two different character selections, both normal levels and Secret City, vehicle and foot movement, web slowing, guns, knockout/respawn, leaving/reconnecting and manual fallback on two actual devices. Automated runtime browser-to-browser tests were not executed.
