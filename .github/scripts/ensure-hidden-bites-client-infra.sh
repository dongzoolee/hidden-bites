#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-ap-northeast-2}"
HIDDEN_BITES_BUCKET_NAME="${HIDDEN_BITES_BUCKET_NAME:-hidden-bites-production}"
CLOUDFRONT_FUNCTION_NAME="${CLOUDFRONT_FUNCTION_NAME:-HiddenBites-Routing}"
FUNCTION_SOURCE="${FUNCTION_SOURCE:-.github/cloudfront/viewer-request.js}"

if ! aws s3api head-bucket --bucket "$HIDDEN_BITES_BUCKET_NAME" >/dev/null 2>&1; then
  aws s3api create-bucket \
    --bucket "$HIDDEN_BITES_BUCKET_NAME" \
    --region "$AWS_REGION" \
    --create-bucket-configuration "LocationConstraint=$AWS_REGION" >/dev/null
fi

aws s3api put-public-access-block \
  --bucket "$HIDDEN_BITES_BUCKET_NAME" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true >/dev/null

aws s3api put-bucket-encryption \
  --bucket "$HIDDEN_BITES_BUCKET_NAME" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' >/dev/null

if aws cloudfront describe-function --name "$CLOUDFRONT_FUNCTION_NAME" --stage DEVELOPMENT >/dev/null 2>&1; then
  etag="$(aws cloudfront describe-function --name "$CLOUDFRONT_FUNCTION_NAME" --stage DEVELOPMENT --query ETag --output text)"
  aws cloudfront update-function \
    --name "$CLOUDFRONT_FUNCTION_NAME" \
    --if-match "$etag" \
    --function-config "Comment=Hidden Bites client routing,Runtime=cloudfront-js-2.0" \
    --function-code "fileb://$FUNCTION_SOURCE" >/dev/null
else
  aws cloudfront create-function \
    --name "$CLOUDFRONT_FUNCTION_NAME" \
    --function-config "Comment=Hidden Bites client routing,Runtime=cloudfront-js-2.0" \
    --function-code "fileb://$FUNCTION_SOURCE" >/dev/null
fi

publish_etag="$(aws cloudfront describe-function --name "$CLOUDFRONT_FUNCTION_NAME" --stage DEVELOPMENT --query ETag --output text)"
aws cloudfront publish-function \
  --name "$CLOUDFRONT_FUNCTION_NAME" \
  --if-match "$publish_etag" >/dev/null

if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
  account_id="$(aws sts get-caller-identity --query Account --output text)"
  policy_file="$(mktemp)"
  cat > "$policy_file" <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$HIDDEN_BITES_BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::$account_id:distribution/$CLOUDFRONT_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
POLICY
  aws s3api put-bucket-policy --bucket "$HIDDEN_BITES_BUCKET_NAME" --policy "file://$policy_file" >/dev/null
  rm -f "$policy_file"
fi
