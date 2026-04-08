import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel relative w-full max-w-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          ✕
        </button>

        <header className="mb-5 pr-10">
          <h2 id="how-it-works-title" className="text-2xl font-bold text-slate-950">
            Cómo funciona el planificador de comidas
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Las fórmulas, los supuestos y por qué elegimos cada método.
          </p>
        </header>

        <div className="flex flex-col gap-6 text-sm leading-relaxed text-slate-800">
          <Section title="1. Qué calcula la app">
            <p>
              A partir de tus métricas corporales (edad, estatura, peso actual, peso meta,
              % de grasa actual, % de grasa meta, semanas para llegar y nivel de actividad),
              la app estima cuántas <strong>calorías</strong> y cuántos gramos de{' '}
              <strong>proteína, carbohidratos y grasa</strong> deberías comer cada día para
              alcanzar tu objetivo en el plazo que definiste, preservando masa muscular.
            </p>
          </Section>

          <Section title="2. Tasa metabólica basal (BMR)">
            <p>Usamos la fórmula <strong>Katch-McArdle</strong>:</p>
            <Formula>BMR = 370 + 21.6 × LBM</Formula>
            <p>
              Donde <code>LBM</code> = masa magra = <code>peso × (1 − %grasa/100)</code>.
            </p>
            <p>
              <strong>¿Por qué Katch-McArdle y no Mifflin-St Jeor o Harris-Benedict?</strong>{' '}
              Porque tú ya conoces tu % de grasa. Las otras fórmulas estiman el BMR a partir
              de sexo, edad, peso y altura, asumiendo una composición corporal "promedio".
              Katch-McArdle parte directamente de tu masa magra real, así que no necesita
              asumir tu sexo y refleja mejor la diferencia entre dos personas con el mismo
              peso pero distinta composición.
            </p>
            <p className="text-slate-600">
              <em>Nota:</em> ninguna fórmula de BMR es exacta. El error típico es ±10–15%
              entre individuos. Si después de 3–4 semanas tu peso no responde como esperas,
              ajusta el target manualmente con el override de kcal.
            </p>
          </Section>

          <Section title="3. Gasto energético total (TDEE)">
            <p>
              El TDEE es lo que realmente quemas en un día completo. Multiplicamos el BMR
              por un <strong>factor de actividad</strong>:
            </p>
            <Table
              rows={[
                ['Sedentario', '1.20', 'Trabajo de oficina, sin ejercicio'],
                ['Ligero', '1.375', 'Ejercicio 1–3 días/semana'],
                ['Moderado', '1.55', 'Ejercicio 3–5 días/semana'],
                ['Activo', '1.725', 'Ejercicio intenso 6–7 días/semana'],
                ['Muy activo', '1.90', 'Ejercicio muy intenso, trabajo físico'],
              ]}
              headers={['Nivel', 'Factor', 'Cuándo elegirlo']}
            />
            <p>
              El default es <strong>Activo (1.725)</strong>, pensado para alguien que va al
              gimnasio 90+ minutos, lunes a viernes.
            </p>
          </Section>

          <Section title="4. ¿El TDEE incluye el ejercicio?">
            <p>
              <strong>Sí.</strong> El factor de actividad ya asume tu rutina habitual. Por eso{' '}
              <em>no debes sumar</em> las calorías que quemas en el gym al target diario —
              las estarías contando dos veces.
            </p>
            <p>
              Esta es la diferencia con apps tipo MyFitnessPal o Yazio: ellas estiman el
              gasto <em>sin ejercicio</em> y luego suman lo que registras del entrenamiento.
              Llegan al mismo número total, pero con dos pasos en vez de uno. Como tu rutina
              es estable (gym fijo L–V), el modelo de TDEE-fijo es más predecible y evita el
              error de sobreestimar las calorías quemadas que reportan los wearables.
            </p>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              <strong>Regla simple:</strong> el target que ves en la app es lo que comes,
              entrenes o no entrenes ese día. Si faltas al gym 2–3 días seguidos, considera
              bajar el target ~200 kcal manualmente.
            </p>
          </Section>

          <Section title="5. Déficit (o superávit) calórico">
            <p>
              En lugar de aplicar un porcentaje fijo del TDEE (ej: −20%), calculamos el
              déficit a partir de <strong>cuánta grasa quieres perder y en cuántas semanas</strong>.
              El razonamiento físico:
            </p>
            <Formula>1 kg de grasa corporal ≈ 7700 kcal</Formula>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Calculamos tu masa grasa actual: <code>peso × %grasa</code></li>
              <li>Calculamos tu masa grasa meta: <code>peso meta × %grasa meta</code></li>
              <li>Diferencia × 7700 = energía total a desplazar</li>
              <li>Dividido entre <code>semanas × 7</code> = ajuste diario en kcal</li>
              <li>Target = TDEE + ajuste diario</li>
            </ol>
            <p>
              <strong>¿Por qué timeline en vez de % fijo?</strong> Porque te dice
              exactamente qué tienes que comer para llegar a tu meta en el plazo que tú
              elegiste, en vez de dejarte adivinando "¿cuánto tardaré con −20%?". Si pones
              menos semanas, el déficit crece automáticamente; si pones más, se suaviza.
            </p>
          </Section>

          <Section title="6. Piso de seguridad">
            <p>
              Si las semanas que pediste implican un déficit demasiado agresivo, la app no
              te dejará bajar del mayor entre <strong>tu BMR</strong> y{' '}
              <strong>1200 kcal absolutas</strong>. Verás una advertencia en el scoreboard
              indicando que ajustamos al mínimo seguro y que probablemente necesites más
              semanas para tu meta original.
            </p>
          </Section>

          <Section title="7. Macronutrientes">
            <p>Una vez fijado el target calórico, repartimos así:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Proteína:</strong> <code>2.2 g × LBM</code>. Es la cantidad
                recomendada por la literatura de fuerza para preservar músculo en déficit
                (ISSN 2017). Usamos masa magra en vez de peso corporal para no inflar la
                proteína en personas con % de grasa alto.
              </li>
              <li>
                <strong>Grasa:</strong> <code>0.9 g × peso corporal</code>. Es el mínimo
                saludable (~20% de las kcal totales) para sostener producción hormonal y
                absorción de vitaminas liposolubles.
              </li>
              <li>
                <strong>Carbohidratos:</strong> el resto. <code>(target − proteína×4 − grasa×9) / 4</code>.
                Como los carbs cierran el balance, escalan con tu nivel de actividad: si
                entrenas duro tendrás más, si estás en déficit profundo tendrás menos.
              </li>
            </ul>
          </Section>

          <Section title="8. Generación de comidas">
            <p>
              El target diario se reparte en cinco comidas (desayuno, snack 1, almuerzo,
              snack 2, cena) usando un presupuesto proporcional. Cada comida elige
              alimentos de un catálogo interno, respetando:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La proteína animal del día (pollo, res o cerdo) — solo en almuerzo y cena.</li>
              <li>El presupuesto calórico de cada slot.</li>
              <li>Variedad: el botón de re-roll cambia un alimento o la comida entera sin alterar el resto del día.</li>
            </ul>
            <p>
              Si activas Persona 2, el generador calcula presupuestos paralelos por comida
              y muestra las cantidades equivalentes para cada perfil sobre los mismos platos.
            </p>
          </Section>

          <Section title="9. Override manual y reset">
            <p>
              Puedes editar el campo "Kcal objetivo" en cualquier momento. Cuando lo haces,
              la app marca un override manual y deja de auto-recalcular cuando cambies otras
              métricas. Aparece un botón <strong>Auto</strong> al lado del input para volver
              al valor sugerido por la fórmula.
            </p>
          </Section>

          <Section title="10. Limitaciones honestas">
            <ul className="list-disc pl-5 space-y-1">
              <li>Las fórmulas de BMR son estimaciones, no mediciones. Tu metabolismo real puede variar ±10–15%.</li>
              <li>El % de grasa que ingresas debe ser razonablemente preciso (báscula bioimpedancia, DEXA o pliegues). Errores grandes en BF% se propagan a todo el cálculo.</li>
              <li>El modelo asume que tu rutina de ejercicio es estable. Si varía mucho semana a semana, ajusta el override manual.</li>
              <li>No reemplaza la consulta con un nutricionista o médico, sobre todo si tienes condiciones metabólicas o médicas.</li>
            </ul>
          </Section>
        </div>

        <footer className="mt-6 flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Entendido
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900">
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 text-slate-800">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
