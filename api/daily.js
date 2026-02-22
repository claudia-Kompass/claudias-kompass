export default function handler(req, res) {
  res.status(200).json({
    executive: "OK",
    regional: "OK",
    weather: "OK",
    personal: "OK",
    travel: "OK"
  });
}
