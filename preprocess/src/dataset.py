import csv
import os

rows = [["response_id", "rating"]]
valid_status = ["Good", "OK", "Poor"]
invalid_status = ["Gd", "Excellent", "", "good"]


def generate_synthetic():
    id_num = 1

    # 28 valid rows
    for i in range(28):
        rows.append([f"r{id_num:02d}", valid_status[i % 3]])
        id_num += 1

    # 3 invalid rows
    for i in range(3):
        rows.append([f"r{id_num:02d}", invalid_status[i]])
        id_num += 1

    # Duplicates by reuse earlier IDs
    rows.append(["r03", "Good"])
    rows.append(["r07", "Poor"])

    os.makedirs("data", exist_ok=True)

    with open("data/responses_synthetic.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    print(f"Wrote {len(rows) - 1} data rows to data/responses_synthetic.csv")


if __name__ == "__main__":
    generate_synthetic()
