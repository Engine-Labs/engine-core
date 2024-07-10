export function getWidgets(colour: string): string[] {
  switch (colour) {
    case "red":
      return [
        "Fire chilli widget",
        "Big stop sign widget",
        "Bursting heart widget",
      ];
    case "yellow":
      return ["Hello sunshine widget", "Banana custard widget"];
    case "green":
      return ["Slimey widget", "Fresh meadow widget", "Granny smith widget"];
    case "purple":
      return ["Prince rain widget", "Hendrix haze widget"];
    default:
      return [];
  }
}
