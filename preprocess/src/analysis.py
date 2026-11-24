import pandas as pd

df = pd.read_csv("data/responses_synthetic.csv")

print("Sum of counts: \n", df["rating"].value_counts())
print('Missing values (""): ', df["rating"].isnull().sum())
