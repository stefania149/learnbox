import { Ecran, AntetEcran, ContinutEcran, BaraActiuni, Panou } from "@/componente/ecran";
import { ButonLegatura } from "@/componente/buton";

export default function Negasit() {
  return (
    <Ecran>
      <AntetEcran
        titlu="Pagina asta nu există"
        subtitlu="Adresa cerută nu duce nicăieri în aplicație."
      />
      <ContinutEcran>
        <Panou>
          <p className="text-text-slab">
            Ori linkul e vechi, ori s-a strecurat o greșeală în adresă. Nimic
            din progresul tău nu e afectat — el stă în browser, nu în pagina
            asta.
          </p>
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href="/">Înapoi la început</ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
