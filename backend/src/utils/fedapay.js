// Outils pour créer une transaction FedaPay et vérifier son statut.
// FEDAPAY_ENV doit valoir "sandbox" (test) ou "live" (production).

const FEDAPAY_ENV = process.env.FEDAPAY_ENV === 'live' ? 'live' : 'sandbox';
const BASE_URL =
  FEDAPAY_ENV === 'live' ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1';

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

// Crée une transaction, puis génère l'adresse de paiement hébergée par FedaPay.
async function createCheckoutTransaction({ amount, description, customerEmail, customData }) {
  const createRes = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      description,
      amount,
      currency: { iso: 'XOF' },
      customer: { email: customerEmail },
      custom_data: customData,
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createData?.message || 'Erreur lors de la création de la transaction FedaPay.');
  }
  const transactionId = createData['v1/transaction'].id;

  const tokenRes = await fetch(`${BASE_URL}/transactions/${transactionId}/token`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(tokenData?.message || "Erreur lors de la génération du lien de paiement.");
  }

  return { transactionId, checkoutUrl: tokenData.url };
}

// Interroge FedaPay pour connaître le statut réel d'une transaction
// (plus sûr que de faire confiance à un simple appel du frontend).
async function getTransactionStatus(transactionId) {
  const res = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Erreur lors de la vérification de la transaction.');
  }
  return data['v1/transaction'];
}

module.exports = { createCheckoutTransaction, getTransactionStatus };
