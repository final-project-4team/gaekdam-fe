import api from "@/api/axios.js";

export const getLoyaltyGradeList = async () => {
  const res = await api.get("/loyalty-grade");
  return res.data.data;
};

export const getLoyaltyGradeDetail = async (loyaltyGradeCode) => {
  const res = await api.get("/loyalty-grade/" + loyaltyGradeCode);
  return res.data.data;
};
export const createLoyaltyGrade = async (loyaltyGradeDetail) => {
  const res = await api.post("/loyalty-grade", loyaltyGradeDetail);
  return res.data.data;
};

export const updateLoyaltyGrade = async (loyaltyGradeDetail) => {
  const res = await api.put("/loyalty-grade", loyaltyGradeDetail);
  return res.data.data;
};

export const deleteLoyaltyGrade = async (loyaltyGradeCode) => {
  const res = await api.delete("/loyalty-grade/" + loyaltyGradeCode);
  return res.data.data;
};

