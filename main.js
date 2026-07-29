document.addEventListener("DOMContentLoaded", function(){
let data = [4,6,8,10,12,9,7,11,5,6];

const colors = [
  "#C0392B","#2980B9","#27AE60","#8E44AD","#E67E22",
  "#16A085","#D35400","#2C3E50","#7F8C8D","#9B59B6"
];

/* ===== FUNCIONES ===== */
function mean(a){
  return a.reduce((s,x)=>s+x,0)/a.length;
}

function stdDev(a){
  const m = mean(a);
  return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/a.length);
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

/* ===== PLUGIN ETIQUETAS + TEXTO AUTOMÁTICO ===== */
const labelPlugin = {
  id:'valueLabels',
  afterDatasetsDraw(chart){
    const {ctx} = chart;
    const m = mean(data);
    const s = stdDev(data);

    ctx.save();
    ctx.font = '12px Segoe UI';
    ctx.fillStyle = '#003A8F';

    chart.data.datasets.forEach((dataset, dIndex)=>{
      const meta = chart.getDatasetMeta(dIndex);

      meta.data.forEach((point,i)=>{
        const x = point.x;
        const y = point.y;

        /* Etiquetas de puntos */
       if(dataset.label === "Datos"){
          const d = data[i] - m; // desviación respecto a la media
         //Cambiar color dependiendo si se encuentra arriba o abajo de la media 
          
          const text = `d${i+1} = ${d.toFixed(2)}`;

          // medir tamaño del texto
          const padding = 4;
          const textWidth = ctx.measureText(text).width;
          const textHeight = 12; // aprox por la fuente

          const rectX = x + 8;
          const rectY = y - 18;

          // fondo del cuadro
          ctx.fillStyle = "rgba(255,255,255,0.85)"; // blanco
         ctx.fillStyle = "rgba(255,255,255,0.9)";
          roundRect(ctx, rectX - padding, rectY - textHeight, textWidth + padding*2, textHeight + padding, 6);
          ctx.fill();

          ctx.strokeStyle = "#ffff";
          ctx.stroke();
          // color del texto según signo
          ctx.fillStyle = d >= 0 ? "#27AE60" : "#C0392B";

          // texto
          ctx.fillText(text, rectX, rectY);
        }

        /* Etiquetas de líneas (solo último punto) */
        if(i === meta.data.length - 1){
          if(dataset.label === "Media"){
            ctx.fillText(`x̄ = ${m.toFixed(2)}`, x + 10, y);
          }
          if(dataset.label === "Media + σ"){
            ctx.fillText(`x̄ + σ = ${(m+s).toFixed(2)}`, x + 10, y);
          }
          if(dataset.label === "Media − σ"){
            ctx.fillText(`x̄ − σ = ${(m-s).toFixed(2)}`, x + 10, y);
          }
        }
      });
    });

    /* ===== TEXTO AUTOMÁTICO DE DISPERSIÓN ===== */
    const dispersionText = s > 2.5 ? "Alta dispersión" : "Baja dispersión";

    ctx.font = 'bold 14px Segoe UI';
    ctx.fillStyle = s > 2.5 ? "#C0392B" : "#27AE60";
    ctx.fillText(
      ` ${dispersionText}`,
      chart.chartArea.left + 10,
      chart.chartArea.top + 20
    );

    ctx.restore();
  }
};

/* ===== ACTUALIZAR ===== */
function update(){
  const m = mean(data);
  const s = stdDev(data);

  document.getElementById("meanValue").textContent = m.toFixed(2);
  document.getElementById("stdValue").textContent  = s.toFixed(2);
 

  document.getElementById("meanCalc").innerHTML =
    `x̄ = (${data.map((x,i)=>`<span style="color:${colors[i]}">${x}</span>`).join(" + ")}) / ${data.length}
     = <strong>${m.toFixed(2)}</strong>`;

  document.getElementById("stdCalc").innerHTML =
    `σ = √( ${data.map((x,i)=>`(<span style="color:${colors[i]}">${(x-m).toFixed(2)}</span>)²`).join(" + ")} / ${data.length} )
     = <strong>${s.toFixed(2)}</strong>`;

  


  chart.data.datasets.forEach(ds=>{
    if(ds.label==="Media") ds.data.forEach(p=>p.y=m);
    if(ds.label==="Media + σ") ds.data.forEach(p=>p.y=m+s);
    if(ds.label==="Media − σ") ds.data.forEach(p=>p.y=m-s);
  });

  chart.data.datasets = chart.data.datasets.filter(ds=>!ds.isDistance);

  data.forEach((y,i)=>{
    chart.data.datasets.push({
      label:`|x${i+1} − x̄|`,
      isDistance:true,
      type:"line",
      data:[{x:i+1,y},{x:i+1,y:m}],
      borderColor:colors[i],
      borderDash:[4,4],
      pointRadius:0
    });
  });

// ===== PROPIEDAD DE LA MEDIA =====
const mFixed = m.toFixed(1);

// d₁ + d₂ + ...
const sumaD = data.map((x,i)=>{
  const diff = x - m;
  const color = diff >= 0 ? "#27AE60" : "#C0392B";
  return `<span style="color:${color}">d<sub>${i+1}</sub></span>`;
 
}).join(" + ");

// (x - media) con color según signo
const desarrollo = data.map(x=>{
  const diff = (x - m);
  const color = diff >= 0 ? "#27AE60" : "#C0392B";
  return `<span style="color:${color}">(${x}-${mFixed})</span>`;
}).join(" + ");

// suma de desviaciones (por si quieres mostrar que da 0)
const sumaTotal = data.reduce((acc,x)=>acc+(x-m),0).toFixed(2);

document.getElementById("propiedadMedia").innerHTML = `
<strong>Propiedad de la media aritmética</strong><br>
${sumaD} = 0<br>
${desarrollo} = <strong>${sumaTotal}</strong>
`;

// ===== REGLA EMPÍRICA =====
const lower = (m - s).toFixed(1);
const upper = (m + s).toFixed(1);

document.getElementById("reglaEmpirica").innerHTML = `
<strong>Regla empírica sobre la desviación estándar</strong><br><br>
Si los datos se agrupan y forman una distribución simétrica unimodal, 
entonces al menos el 60% de los datos están contenidos en el intervalo 
[
  <span style="color:#C0392B">${lower}</span>, 
  <span style="color:#27AE60">${upper}</span>
</span>
].
`;

  chart.update();
}

/* ===== CHART ===== */
const chart = new Chart(document.getElementById("chart"),{
  type:"scatter",
  data:{
    datasets:[
      {
        label:"Datos",
        data:data.map((y,i)=>({x:i+1,y})),
        backgroundColor:colors,
        pointRadius:8
      },
      {
        label:"Media",
        type:"line",
        data:data.map((_,i)=>({x:i+1,y:0})),
        borderColor:"#C0392B",
        borderDash:[6,6],
        pointRadius:0
      },
      {
        label:"Media + σ",
        type:"line",
        data:data.map((_,i)=>({x:i+1,y:0})),
        borderColor:"#27AE60",
        pointRadius:0
      },
      {
        label:"Media − σ",
        type:"line",
        data:data.map((_,i)=>({x:i+1,y:0})),
        borderColor:"#8E44AD",
        pointRadius:0
      }
    ]
  },
  options:{
    plugins:{
      dragData:{
        round:1,
        onDragEnd:(e,d,i,v)=>{
          data[i]=v.y;
          update();
        }
      }
    },
    scales:{
      x:{min:0,max:11,ticks:{stepSize:1},title:{display:true,text:"Dato"}},
      y:{min:0,max:20,ticks:{stepSize:1},title:{display:true,text:"Valor"}}
    }
  },
  plugins:[labelPlugin]
});



/* ================= EJEMPLO 2: DATOS AGRUPADOS ================= */
const groupedMarks = [153, 160, 167, 174, 181, 188];
const groupedLabels = ["150–156", "157–163", "164–170", "171–177", "178–184", "185–191"];
const groupedFixedFrequencies = [1, null, null, null, 17, 1];

const groupedChart = new Chart(document.getElementById("groupedBarChart"), {
  type: "bar",
  data: {
    labels: groupedLabels,
    datasets: [{
      label: "Frecuencia",
      data: [1, 21, 54, 22, 17, 1],
      backgroundColor: "rgba(0, 58, 143, 0.72)",
      borderColor: "#003A8F",
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Distribución de frecuencias por intervalo de altura" }
    },
    scales: {
      x: { title: { display: true, text: "Altura (cm)" } },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
        title: { display: true, text: "Frecuencia" }
      }
    }
  }
});

function getGroupedFrequencies(){
  const editable = ["freq2", "freq3", "freq4"].map(id => {
    const input = document.getElementById(id);
    const value = Math.max(0, Math.trunc(Number(input.value) || 0));
    input.value = value;
    return value;
  });

  return [
    groupedFixedFrequencies[0],
    editable[0],
    editable[1],
    editable[2],
    groupedFixedFrequencies[4],
    groupedFixedFrequencies[5]
  ];
}

function groupedMedian(frequencies){
  const total = frequencies.reduce((sum, value) => sum + value, 0);
  if(total === 0) return 0;

  const half = total / 2;
  let cumulative = 0;

  for(let i = 0; i < frequencies.length; i++){
    const previous = cumulative;
    cumulative += frequencies[i];

    if(cumulative >= half){
      const lowerBoundary = 149.5 + (i * 7);
      const classWidth = 7;
      const classFrequency = frequencies[i];

      if(classFrequency === 0) return groupedMarks[i];
      return lowerBoundary + ((half - previous) / classFrequency) * classWidth;
    }
  }

  return groupedMarks[groupedMarks.length - 1];
}

function updateGroupedExample(){
  const frequencies = getGroupedFrequencies();
  const total = frequencies.reduce((sum, value) => sum + value, 0);
  document.getElementById("groupedTotal").textContent = total;

  groupedChart.data.datasets[0].data = frequencies;
  groupedChart.update();

  const meanNumerator = groupedMarks.reduce(
    (sum, mark, index) => sum + mark * frequencies[index], 0
  );
  const groupedMean = total > 0 ? meanNumerator / total : 0;

  const varianceNumerator = groupedMarks.reduce(
    (sum, mark, index) => sum + frequencies[index] * ((mark - groupedMean) ** 2), 0
  );
  const groupedStd = total > 0 ? Math.sqrt(varianceNumerator / total) : 0;
  const median = groupedMedian(frequencies);

  // Coeficiente de asimetría de Pearson: As = 3(x̄ − Me) / σ.
  const pearsonSkewness = groupedStd > 0
    ? (3 * (groupedMean - median)) / groupedStd
    : 0;

  // Criterio didáctico: |As| <= 0.5 se interpreta como aproximadamente simétrica.
  const isSymmetric = Math.abs(pearsonSkewness) <= 0.5;
  const lower = groupedMean - groupedStd;
  const upper = groupedMean + groupedStd;

  const insideFrequency = groupedMarks.reduce((sum, mark, index) => {
    return sum + (mark >= lower && mark <= upper ? frequencies[index] : 0);
  }, 0);
  const insidePercentage = total > 0 ? (insideFrequency / total) * 100 : 0;

  const meanTerms = groupedMarks
    .map((mark, index) => `${mark} × ${frequencies[index]}`)
    .join(" + ");

  const stdTerms = groupedMarks
    .map((mark, index) => `(${mark} − ${groupedMean.toFixed(2)})² × ${frequencies[index]}`)
    .join(" + ");

  document.getElementById("groupedMeanCalc").innerHTML = `
    <strong>Media aritmética para datos agrupados</strong><br><br>
    x̄ = (${meanTerms}) / ${total || 1}
    = <strong>${groupedMean.toFixed(2)} cm</strong>
  `;

  document.getElementById("groupedStdCalc").innerHTML = `
    <strong>Desviación estándar poblacional</strong><br><br>
    σ = √[(${stdTerms}) / ${total || 1}]
    = <strong>${groupedStd.toFixed(2)} cm</strong>
  `;

  document.getElementById("groupedSymmetryCalc").innerHTML = `
    <strong>Comprobación de simetría</strong><br><br>
    Me ≈ ${median.toFixed(2)} cm<br>
    A<sub>s</sub> = 3(x̄ − Me) / σ
    = 3(${groupedMean.toFixed(2)} − ${median.toFixed(2)}) / ${groupedStd.toFixed(2) || "0"}
    = <strong>${pearsonSkewness.toFixed(3)}</strong><br>
    Criterio usado: si |A<sub>s</sub>| ≤ 0.5, la distribución se considera aproximadamente simétrica.
  `;

  const interpretation = document.getElementById("groupedInterpretation");
  interpretation.className = `symmetry-message ${isSymmetric ? "symmetric" : "asymmetric"}`;

  if(total === 0){
    interpretation.innerHTML = "Ingresa al menos una frecuencia mayor que cero para realizar los cálculos.";
  }else if(isSymmetric){
    interpretation.innerHTML = `
      <strong>La distribución es aproximadamente simétrica.</strong>
      El intervalo x̄ ± σ es [${lower.toFixed(2)}, ${upper.toFixed(2)}] cm.
      Usando las marcas de clase como aproximación, ${insideFrequency} de ${total} datos
      (${insidePercentage.toFixed(1)}%) se encuentran dentro de ese intervalo.
    `;
  }else{
    const direction = pearsonSkewness > 0 ? "hacia la derecha" : "hacia la izquierda";
    interpretation.innerHTML = `
      <strong>La distribución no se considera simétrica;</strong> presenta asimetría ${direction}.
      Por ello, no debe aplicarse automáticamente la afirmación del 60% basada en una distribución simétrica unimodal.
      Como referencia, el intervalo x̄ ± σ es [${lower.toFixed(2)}, ${upper.toFixed(2)}] cm y contiene,
      usando las marcas de clase, ${insidePercentage.toFixed(1)}% de los datos.
    `;
  }
}

["freq2", "freq3", "freq4"].forEach(id => {
  document.getElementById(id).addEventListener("input", updateGroupedExample);
});

updateGroupedExample();


/* ================= QUIZ ================= */

const quizData = [
{
  q: "La media aritmética de un conjunto de datos:",
  options:[
    "	Es ligeramente mayor a los datos y representa un punto de equilibrio",
    "	Es ligeramente menor a los datos y representa un punto de equilibrio",
    "	Está entre los datos y representa un punto de equilibrio"
  ],
  answer:2
},
{
  q:"¿Los valores atípicos afectan la media aritmética que representa a un conjunto de datos?",
  options:[
    "	Sí, los valores atípicos pueden afectar significativamente la media aritmética de un conjunto de datos",
    "	No, los valores atípicos no afectan la media aritmética de un conjunto de datos",
    "	Sí, los valores atípicos afectan significativamente la media aritmética de un conjunto de datos"
  ],
  answer:0
},
{
  q:"Suponga que se tiene 10 datos, dos de estos se encuentran por encima de la media aritmética, ¿Cuál de las aseveraciones es correcta? ",
  options:[
    "La suma de las desviaciones con respecto a la media de los dos datos es igual a la suma de las desviaciones con respecto a la media de los 8 datos restantes",
    "La suma de las desviaciones con respecto a la media de los dos datos más la suma de las desviaciones con respecto a la media de los 8 datos es igual a cero",
    "La suma de las desviaciones con respecto a la media de los dos datos es igual a menos la suma de las desviaciones con respecto a la media de los 8 datos restantes"
  ],
  answer:1
},
{
  q:"La desviación estándar de un conjunto de datos:",
  options:[
    "Si es baja significa que los datos están muy agrupados cerca de la media aritmética. Si es alta significa que los datos están muy alejados de la media aritmética, lo que indica mayor variabilidad",
    "Si es baja significa que los datos están no están agrupados cerca de la media aritmética. Si es alta significa que los datos están poco alejados de la media aritmética, lo que indica poca variabilidad"
  ],
  answer:0
},
{
  q:"¿Cuál es la media aritmética de los siguientes datos: 1, 2, 1, 3, 1, 2, 3, 4, 4, 3?",
  options:["3.0","2.4","3.4"],
  answer:1
},
{
  q:"¿Cuál es la desviación estándar de los siguientes datos: 1, 2, 1, 3, 1, 2, 3, 4, 4, 3?",
  options:["1.2","1.14","0.5"],
  answer:1
},
{
  q:"Si tengo los siguientes datos: 1, 2, 1, 3, 1, 2, 3, 4, 4, 3 ¿Cuál de los siguientes datos es considerado un número atípico?",
  options:["-1","35","6"],
  answer:1
},
{
  q:"Si tengo una distribución simétrica unimodal formada con 200 observaciones, para la cual la media aritmética es igual a 20 y la desviación estándar igual a 0.5. ¿Cuál de las siguientes aseveraciones es verdadera?",
  options:[
    "	El 60% de los datos se encuentran en el intervalo [19,21]",
    "	El 60% de los datos se encuentran en el intervalo [19.5,20.5]",
    "	Al menos 120 datos se encuentran en el intervalo [19.5,20.5]"
  ],
  answer:2
},
{
  q:"Dos máquinas, A y B, producen piezas metálicas cuyo diámetro ideal es de 10 mm. Máquina A: Media aritmética = 10 mm; Desviación estándar = 2.5 mm. Máquina B: Media aritmética= 10.2 mm; Desviación estándar = 0.2 mm.",
  options:[
    "	La máquina A produce las piezas con el diámetro requerido pero mucha variación, es decir, produce piezas muy grandes y muy pequeñas. La máquina B produce piezas ligeramente con el diámetro fuera de lo requerido, pero es mucho más predecible",
    "	La máquina A produce las piezas con el diámetro requerido pero poca variación, es decir, produce piezas muy grandes y muy pequeñas. La máquina B produce piezas ligeramente con el diámetro fuera de lo requerido, pero no es tan predecible."
  ],
  answer:0
},
{
  q:"Un excursionista que no sabe nadar llega a un río que debe cruzar a pie. Un letrero dice: 'Profundidad media del río: 1.20 metros'. El excursionista mide 1.70 metros de altura y decide cruzar confiado porque 'el promedio es menor que su estatura'. Encontrar las dos aseveraciones verdaderas",
  options:[
    "	Una desviación estándar pequeña indica que hay zonas muy profundas que la media aritmética. El promedio indica la profundidad máxima y la desviación estándar no es necesaria para saber las variaciones de profundidad. ",
    "	Una desviación estándar alta indica que hay zonas mucho más profundas que la media aritmética (tal vez pozos de 2 metros o más). El promedio no indica la profundidad máxima, solo el equilibrio del conjunto."
  ],
  answer:1
},
{
  q:"En un examen de matemáticas, la media del grupo fue de 65/100 con una desviación estándar de 20. En un examen de historia, la media fue de 80/100 con una desviación estándar de 2. Un estudiante obtuvo 75 en matemáticas y 78 en historia.",
  options:[
    "	En matemáticas el estudiante fue muy sobresaliente con respecto al grupo por lo que le fue mejor que en historia.  ",
    "	En historia el estudiante sobresalió porque obtuvo la mayor la nota de los dos exámenes y quedó solo poco debajo de la nota que pocos estudiantes obtuvieron cerca de la media",
    "	En historia no sobresalió porque, aunque sacó más nota numérica que en Matemáticas, quedó por debajo de la media en un grupo donde casi todos sacaron lo mismo"
  ],
  answer:2
}
];

/* Mezclar preguntas */
function shuffle(array){
  return array.sort(()=>Math.random()-0.5);
}

const startBtn = document.getElementById("startQuizBtn");
const panel = document.getElementById("quizPanel");
const form = document.getElementById("quizForm");
const result = document.getElementById("quizResult");
const retryBtn = document.getElementById("retryQuiz");
const backdrop = document.getElementById("quizBackdrop");

startBtn.onclick = ()=>{
  panel.classList.remove("hidden");
  panel.classList.remove("minimized");
  requestAnimationFrame(()=>{
    panel.classList.add("show");
  });
  document.body.classList.add("quiz-open")
  loadQuiz();
};

function loadQuiz(){
  form.innerHTML = "";
  result.innerHTML = "";
  retryBtn.classList.add("hidden");

  const shuffled = shuffle([...quizData]);

  shuffled.forEach((q,i)=>{
    const div = document.createElement("div");
    div.innerHTML = `<h3>${i+1}. ${q.q}</h3>`;

    q.options.forEach((opt,j)=>{
      div.innerHTML += `
        <label>
          <input type="radio" name="q${i}" value="${j}">
          ${opt}
        </label>
      `;
    });

    form.appendChild(div);
  });

  form.dataset.answers = JSON.stringify(shuffled.map(q=>q.answer));
}

document.getElementById("submitQuiz").onclick = ()=>{
  const answers = JSON.parse(form.dataset.answers);
  let score = 0;

  answers.forEach((correctAnswer,i)=>{
    const options = form.querySelectorAll(`input[name="q${i}"]`);

    options.forEach(opt=>{
      const label = opt.parentElement;
      label.classList.remove("correct","incorrect");

      if(parseInt(opt.value) === correctAnswer){
        label.classList.add("correct");
      }

      if(opt.checked && parseInt(opt.value) !== correctAnswer){
        label.classList.add("incorrect");
      }
    });

    const selected = form.querySelector(`input[name="q${i}"]:checked`);
    if(selected && parseInt(selected.value) === correctAnswer){
      score++;
    }
  });

  result.innerHTML = `
    <h3>Resultado: ${score} / ${answers.length}</h3>
  `;

  retryBtn.classList.remove("hidden");
};

retryBtn.onclick = loadQuiz;


const closeBtn = document.getElementById("closeQuiz");

function closeQuiz(){
  panel.classList.remove("show");
  panel.classList.remove("minimized");
  setTimeout(()=>{
    panel.classList.add("hidden");
  },250);
  document.body.classList.remove("quiz-open");
}


const minimizeBtn = document.getElementById("minimizeQuiz");
minimizeBtn.onclick = ()=>{
  const isMinimized = panel.classList.toggle("minimized");
  minimizeBtn.textContent = isMinimized ? "▢" : "—";
  minimizeBtn.setAttribute("aria-label", isMinimized ? "Restaurar cuestionario" : "Minimizar cuestionario");
  minimizeBtn.title = isMinimized ? "Restaurar cuestionario" : "Minimizar cuestionario";
};

closeBtn.onclick = closeQuiz;
document.addEventListener("keydown", (event)=>{
  if(event.key === "Escape" && panel.classList.contains("show")){
    closeQuiz();
  }
});

update();

});

