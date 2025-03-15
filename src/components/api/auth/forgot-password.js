import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const response = await axios.post(`${process.env.BACKEND_URL}/auth/forgot-password`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: "Something went wrong" });
  }
}
