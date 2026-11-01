import Link from "next/link";
// MODÈLE À COMPLÉTER ET À FAIRE VALIDER avant toute vente : remplace chaque [À COMPLÉTER].
export default function Legal() {
  const h = "mt-8 text-xl font-semibold";
  return (
    <main className="mx-auto max-w-2xl space-y-3 px-4 py-10 text-sm leading-relaxed text-muted-foreground">
      <Link href="/login" className="text-success underline">← Retour</Link>
      <h1 className="text-3xl font-semibold text-foreground">Informations légales</h1>
      <h2 className={h}>Avertissement santé</h2>
      <p>FitSaaS est un outil de suivi et d'information. Il ne fournit ni diagnostic, ni conseil médical, et ne remplace pas l'avis d'un médecin ou d'un diététicien. Les objectifs caloriques sont des estimations. Consulte un professionnel de santé avant de modifier fortement ton alimentation ou ton activité, notamment en cas de pathologie, de grossesse ou de trouble du comportement alimentaire. Aucun résultat n'est garanti.</p>
      <h2 className={h}>Mentions légales</h2>
      <p>Éditeur : [À COMPLÉTER : nom, statut, adresse, SIRET]. Contact : [À COMPLÉTER : email]. Directeur de la publication : [À COMPLÉTER]. Hébergement : Vercel Inc., 340 S Lemon Ave, Walnut, CA 91789, États-Unis. Base de données : Supabase.</p>
      <h2 className={h}>Conditions d'utilisation et d'abonnement</h2>
      <p>Le service est réservé aux personnes majeures. L'abonnement FitSaaS Pro est mensuel, à [À COMPLÉTER : prix] TTC, précédé d'un essai gratuit de 7 jours. Sans résiliation avant la fin de l'essai, l'abonnement démarre et se renouvelle chaque mois. Tu peux résilier à tout moment depuis Réglages, puis Abonnement : l'accès reste actif jusqu'à la fin de la période payée. Les paiements sont traités par Stripe. [À COMPLÉTER : droit de rétractation, remboursements, responsabilité, droit applicable.]</p>
      <h2 className={h}>Politique de confidentialité</h2>
      <p>Données traitées : email, profil (âge, taille, poids, objectifs, préférences), pesées, journal alimentaire, séances. Ces données de santé ne sont utilisées que pour fournir le service. Elles ne sont ni vendues ni partagées à des fins publicitaires. Sous-traitants : Supabase, Vercel, Stripe. Conservation : tant que ton compte existe ; la suppression du compte efface tes données. Droits : accès, rectification, export et suppression sont disponibles dans Réglages. Pour toute demande : [À COMPLÉTER : email].</p>
    </main>
  );
}
