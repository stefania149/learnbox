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
            Are capitole și lecții: citești briefingul, scrii cod, iar cazurile
            de test spun cât a ieșit. Lecțiile se deschid pe rând.
          </p>
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href="/curs/">Intră în curs</ButonLegatura>
        <ButonLegatura href="/progres/" fel="secundar">
          Progres
        </ButonLegatura>
        <ButonLegatura href="/python/" fel="secundar">
          Scrie cod liber
        </ButonLegatura>
        <ButonLegatura href="/stare/" fel="secundar">
          Verifică browserul
        </ButonLegatura>
        <ButonLegatura href="/setari/" fel="secundar">
          Setări
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
