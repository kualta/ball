import type { Locale } from "./i18n";

export const shareCopy: Record<
  Locale,
  {
    heading: string;
    preview: string;
    save: string;
    share: string;
    close: string;
    error: string;
  }
> = {
  en: {
    heading: "I asked the real 8 ball:",
    preview: "Share answer",
    save: "Save image",
    share: "Share",
    close: "Close",
    error: "Couldn’t create the image. Try again.",
  },
  es: {
    heading: "Le pregunté a la bola 8 real:",
    preview: "Compartir respuesta",
    save: "Guardar imagen",
    share: "Compartir",
    close: "Cerrar",
    error: "No se pudo crear la imagen. Inténtalo de nuevo.",
  },
  pt: {
    heading: "Perguntei à bola 8 de verdade:",
    preview: "Compartilhar resposta",
    save: "Salvar imagem",
    share: "Compartilhar",
    close: "Fechar",
    error: "Não foi possível criar a imagem. Tente novamente.",
  },
  fr: {
    heading: "J’ai demandé à la vraie boule 8 :",
    preview: "Partager la réponse",
    save: "Enregistrer l’image",
    share: "Partager",
    close: "Fermer",
    error: "Impossible de créer l’image. Réessayez.",
  },
  de: {
    heading: "Ich habe die echte 8-Kugel gefragt:",
    preview: "Antwort teilen",
    save: "Bild speichern",
    share: "Teilen",
    close: "Schließen",
    error: "Bild konnte nicht erstellt werden. Versuche es erneut.",
  },
  ru: {
    heading: "Я спросил настоящий шар 8:",
    preview: "Поделиться ответом",
    save: "Сохранить изображение",
    share: "Поделиться",
    close: "Закрыть",
    error: "Не удалось создать изображение. Попробуйте снова.",
  },
  ar: {
    heading: "سألت كرة 8 الحقيقية:",
    preview: "مشاركة الإجابة",
    save: "حفظ الصورة",
    share: "مشاركة",
    close: "إغلاق",
    error: "تعذّر إنشاء الصورة. حاول مجددًا.",
  },
  hi: {
    heading: "मैंने असली 8 बॉल से पूछा:",
    preview: "जवाब साझा करें",
    save: "चित्र सहेजें",
    share: "साझा करें",
    close: "बंद करें",
    error: "चित्र नहीं बन सका। फिर कोशिश करें।",
  },
  zh: {
    heading: "我问了真正的8号球：",
    preview: "分享答案",
    save: "保存图片",
    share: "分享",
    close: "关闭",
    error: "无法生成图片，请重试。",
  },
  ja: {
    heading: "本物の8ボールに聞いてみた：",
    preview: "答えをシェア",
    save: "画像を保存",
    share: "シェア",
    close: "閉じる",
    error: "画像を作成できませんでした。もう一度どうぞ。",
  },
  ko: {
    heading: "진짜 8볼에게 물어봤어요:",
    preview: "답변 공유",
    save: "이미지 저장",
    share: "공유",
    close: "닫기",
    error: "이미지를 만들지 못했어요. 다시 시도하세요.",
  },
};

function wrapQuestion(
  context: CanvasRenderingContext2D,
  question: string,
  size: number,
) {
  context.font = `500 ${size}px Manrope, Arial, sans-serif`;
  const segments = new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  }).segment(question);
  const lines: string[] = [];
  let line = "";
  for (const { segment } of segments) {
    if (context.measureText(line + segment).width > 1000 && line) {
      const space = line.lastIndexOf(" ");
      if (space > line.length / 2) {
        lines.push(line.slice(0, space));
        line = line.slice(space + 1) + segment;
      } else {
        lines.push(line);
        line = segment;
      }
    } else line += segment;
  }
  if (line) lines.push(line);
  return lines;
}

export function createShareImage(
  question: string,
  ball: HTMLCanvasElement,
  locale: Locale,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1500;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#07070a";
  context.fillRect(0, 0, 1200, 1500);
  context.drawImage(ball, 0, 160);
  const fade = context.createLinearGradient(0, 160, 0, 310);
  fade.addColorStop(0, "#07070a");
  fade.addColorStop(1, "#07070a00");
  context.fillStyle = fade;
  context.fillRect(0, 160, 1200, 150);
  context.fillStyle = "#aaa4bb";
  context.font = "500 36px Manrope, Arial, sans-serif";
  context.direction = locale === "ar" ? "rtl" : "ltr";
  context.textAlign = "center";
  context.fillText(shareCopy[locale].heading, 600, 70);
  const text = question.replace(/\s+/g, " ").trim();
  let fontSize = 60;
  let lines = wrapQuestion(context, text, fontSize);
  while (lines.length * fontSize * 1.35 > 260 && fontSize > 14) {
    fontSize -= 2;
    lines = wrapQuestion(context, text, fontSize);
  }
  context.fillStyle = "#eeeaf5";
  context.direction = /[\u0600-\u06ff]/.test(text) ? "rtl" : "ltr";
  const top = 140;
  lines.forEach((line, index) =>
    context.fillText(line, 600, top + index * fontSize * 1.35),
  );
  context.direction = "ltr";
  context.fillStyle = "#9993a8";
  context.font = "500 25px Manrope, Arial, sans-serif";
  context.fillText("real8ball.com", 600, 1432);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Image export failed")),
      "image/png",
    ),
  );
}
