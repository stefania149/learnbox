import { Ecran, AntetEcran, ContinutEcran, BaraActiuni, Panou } from "@/componente/ecran";
import { ButonLegatura } from "@/componente/buton";

export default function Acasa() {
  return (
    <Ecran>
      <AntetEcran
        titlu="Tutore"
        subtitlu="Un joc de învățat, care rulează întreg în browser."
      />
      <ContinutEcran>
        <Panou titlu="Deocamdată">
          <p className="text-text-slab">
            Aplicația e publicată ca site static: nu există server, cont sau
            cheie de API. Cursurile, exercițiile și progresul vor rula toate
            aici, pe calculatorul tău.
          </p>
          <p className="text-text-slab">
            Primul curs în lucru este <strong className="text-text">Python</strong>.
            Până e gata, poți verifica dacă browserul tău are ce-i trebuie.
          </p>
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href="/stare/">Verifică browserul</ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
