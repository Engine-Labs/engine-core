export function getFruits(colour: string): string {
  switch (colour) {
    case "red":
      return "Apple, Cherry, Strawberry";
    case "yellow":
      return "Banana, Lemon";
    case "green":
      return "Apple, Kiwi, Lime";
    case "purple":
      return "Grape, Plum";
    default:
      return `No ${colour} fruits found`;
  }
}
