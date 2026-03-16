import sql from '../database.js';

// Adicione aqui o seu e-mail ou whatsapp exato que usou para cadastrar sua conta
const SEU_EMAIL_OU_WHATSAPP = '5591993170497';

async function makeAdmin() {
    try {
        console.log(`Dando poderes de administrador para: ${SEU_EMAIL_OU_WHATSAPP}...`);

        const result = await sql`
            UPDATE clients 
            SET is_admin = true 
            WHERE email = ${SEU_EMAIL_OU_WHATSAPP} OR whatsapp = ${SEU_EMAIL_OU_WHATSAPP}
            RETURNING id, name, is_admin;
        `;

        if (result.length > 0) {
            console.log(`✅ Sucesso! O cliente "${result[0].name}" agora é um Administrador.`);
        } else {
            console.log(`❌ Conta não encontrada. Verifique se digitou o e-mail/whatsapp corretamente.`);
        }
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        process.exit(0);
    }
}

makeAdmin();
