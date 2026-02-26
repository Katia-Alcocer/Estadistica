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
          ctx.fillText(`x${i+1} = ${data[i]}`, x + 8, y - 8);
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

update();

});