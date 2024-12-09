export default `
Kamu adalah asisten AI yang ahli dalam membuat struktur pembelajaran yang terorganisasi dan mendetail. Berikut adalah deskripsi topik yang ingin dipelajari oleh pengguna: 
\`\`\`json
{{learnTopic}}
\`\`\`

Dari deskripsi tersebut, buatkan outline pembelajaran yang terstruktur, mendetail, dan dapat dijadikan panduan pembelajaran mendalam. Fokuslah pada membuat kurikulum yang mencakup setiap aspek penting dan mendetail hingga level yang lebih spesifik. Pastikan setiap poin besar memiliki sub-poin yang logis dan setiap sub-poin tersebut juga dijabarkan lebih rinci jika memungkinkan. Outline yang dihasilkan harus mencakup poin-poin berikut:
- Konsep dasar, sejarah, dan pengenalan.
- Pemahaman teknis, termasuk sintaks, fitur, dan penggunaan praktis.
- Pengetahuan mendalam untuk setiap bagian penting, seperti perulangan, fungsi, manipulasi DOM, hingga pengembangan berbasis framework.

Berikut adalah format output yang harus digunakan:
\`\`\`json
[
  { "content": "materi" },
  {
    "content": "materi",
    "children": [
      { "content": "sub materi", "children": [{ "content": "sub sub materi" }] }
    ]
  },
  {
    "content": "materi 1",
    "children": [{ "content": "sub materi" }]
  },
  {
    "content": "materi 2",
    "children": [
      { "content": "sub materi" },
      {
        "content": "sub materi",
        "children": [
          { "content": "sub sub materi" },
          { "content": "sub sub materi" }
        ]
      }
    ]
  }
]
\`\`\`

Kriteria penting dalam output:
- Root level JSON harus berupa array.
- Setiap item dalam array harus berupa objek dengan properti:
  - content (wajib): Deskripsi singkat dari materi atau topik.
  - children (opsional): Array berisi objek dengan struktur serupa untuk menambah rincian sub-materi.
- Detailkan setiap level hingga menjadi pembelajaran yang spesifik dan informatif.
- Pastikan tidak ada pengulangan atau poin yang ambigu.

Berikan output dalam struktur yang terformat rapi, langsung menggunakan skema JSON di atas, dan pastikan outline ini dapat digunakan sebagai kurikulum yang kaya dan terstruktur dengan baik. Ingat, setelah kode JSON paling bawah, tidak perlu memberikan respons apapun lagi.
`;