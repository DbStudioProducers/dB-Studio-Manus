# Descoberta automática na rede local

O Desktop anuncia o serviço mDNS/DNS-SD `_dbstudio._tcp` quando inicia. O anúncio contém somente o nome do produto, a porta HTTP local e os metadados `DBAU/1`; ele não contém senha, token de login ou autorização de usuário.

O app Expo usa `react-native-zeroconf` para procurar `_dbstudio._tcp` na rede local. Ao resolver o serviço, monta internamente o endereço `http://<ip-do-desktop>:<porta>` e exibe a tela de login. O usuário nunca precisa copiar uma URL. A autorização continua sendo feita pelo usuário e senha criados no painel **Usuários e dispositivos autorizados** do Desktop.

## Requisitos de rede

- Desktop e Android/iPhone devem estar na mesma rede Wi-Fi, sem isolamento entre clientes.
- O firewall do Desktop deve permitir a porta HTTP do servidor e UDP 5353 para mDNS.
- No iOS, o primeiro uso solicita permissão de rede local; o projeto declara `NSLocalNetworkUsageDescription` e `NSBonjourServices`.
- O APK precisa ser recompilado após adicionar o módulo nativo mDNS. O APK anterior não contém essa integração.

## Comportamento de segurança

A descoberta é apenas localização. Encontrar um Desktop não cria sessão. O login continua exigindo credenciais cadastradas pelo técnico, e o join do transporte continua exigindo o Bearer token obtido no login.

`EXPO_PUBLIC_API_BASE_URL` permanece disponível como fallback técnico para desenvolvimento, testes de laboratório ou redes que bloqueiam mDNS, mas não é necessário para o fluxo normal do usuário.

O endpoint `GET /api/discovery` existe para diagnóstico local e informa o serviço/porta que o Desktop anuncia. Ele não retorna credenciais.
